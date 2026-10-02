from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.models import User, generate_cuid
from app.core.security import hash_password, verify_password, create_access_token
from app.core.exceptions import BadRequestException, UnauthorizedException
from app.schemas.auth import RegisterRequest, LoginRequest, AuthResponse, UserOut

class AuthService:
    @staticmethod
    async def register(req: RegisterRequest, db: AsyncSession) -> AuthResponse:
        clean_email = req.email.strip().lower()
        
        # Check if user already exists
        result = await db.execute(select(User).where(User.email == clean_email))
        existing_user = result.scalar_one_or_none()
        if existing_user:
            raise BadRequestException(
                code="EMAIL_ALREADY_EXISTS",
                message="An account with this email address already exists."
            )

        # Hash password and create user
        hashed = hash_password(req.password)
        new_user = User(
            id=generate_cuid(),
            name=req.name.strip(),
            email=clean_email,
            hashedPassword=hashed,
            settings={}
        )
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)

        # Issue JWT
        token = create_access_token({"id": new_user.id, "email": new_user.email})
        return AuthResponse(
            success=True,
            token=token,
            user=UserOut.model_validate(new_user)
        )

    @staticmethod
    async def login(req: LoginRequest, db: AsyncSession) -> AuthResponse:
        clean_email = req.email.strip().lower()

        # Find user
        result = await db.execute(select(User).where(User.email == clean_email))
        user = result.scalar_one_or_none()

        # Handle demo user fallback if requested
        if not user and clean_email in ("demo@minigpt.dev", "demo@akashagent.dev") and req.password == "demo123":
            hashed = hash_password(req.password)
            user = User(
                id=generate_cuid(),
                name="Demo User",
                email=clean_email,
                hashedPassword=hashed,
                settings={}
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)

        if not user:
            raise UnauthorizedException(
                code="INVALID_CREDENTIALS",
                message="Invalid email or password."
            )

        # Verify password
        if not verify_password(req.password, user.hashedPassword):
            raise UnauthorizedException(
                code="INVALID_CREDENTIALS",
                message="Invalid email or password."
            )

        token = create_access_token({"id": user.id, "email": user.email})
        return AuthResponse(
            success=True,
            token=token,
            user=UserOut.model_validate(user)
        )

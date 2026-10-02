import enum
import time
import random
import string
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

from sqlalchemy import (
    Column, String, Text, Integer, DateTime, ForeignKey, Index, func
)
from sqlalchemy.dialects.postgresql import JSONB, ENUM
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector

from app.db.database import Base

def generate_cuid() -> str:
    """Generate a standard cuid-like identifier compatible with Prisma default(cuid())."""
    ts = hex(int(time.time() * 1000))[2:]
    rand = "".join(random.choices(string.ascii_lowercase + string.digits, k=10))
    return f"c{ts}{rand}"

class MessageRole(str, enum.Enum):
    USER = "USER"
    ASSISTANT = "ASSISTANT"
    SYSTEM = "SYSTEM"
    TOOL = "TOOL"

class User(Base):
    __tablename__ = "User"

    id = Column(String, primary_key=True, default=generate_cuid)
    email = Column(String, unique=True, nullable=False, index=True)
    hashedPassword = Column(String, nullable=False)
    name = Column(String, nullable=False)
    avatar = Column(String, nullable=True)
    settings = Column(JSONB, nullable=False, default={})

    createdAt = Column(DateTime(timezone=True), nullable=False, default=func.now(), server_default=func.now())
    updatedAt = Column(DateTime(timezone=True), nullable=False, default=func.now(), server_default=func.now(), onupdate=func.now())

    # Relationships
    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
    files = relationship("File", back_populates="user", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="user", cascade="all, delete-orphan")
    memories = relationship("Memory", back_populates="user", cascade="all, delete-orphan")

class Conversation(Base):
    __tablename__ = "Conversation"

    id = Column(String, primary_key=True, default=generate_cuid)
    title = Column(String, nullable=False, default="New conversation")
    userId = Column(String, ForeignKey("User.id", ondelete="CASCADE"), nullable=False, index=True)
    model = Column(String, nullable=False, default="gemini")

    createdAt = Column(DateTime(timezone=True), nullable=False, default=func.now(), server_default=func.now())
    updatedAt = Column(DateTime(timezone=True), nullable=False, default=func.now(), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.createdAt.asc()")
    documents = relationship("Document", back_populates="conversation", cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "Message"

    id = Column(String, primary_key=True, default=generate_cuid)
    role = Column(
        ENUM("USER", "ASSISTANT", "SYSTEM", "TOOL", name="MessageRole", create_type=False),
        nullable=False
    )
    content = Column(Text, nullable=False)
    conversationId = Column(String, ForeignKey("Conversation.id", ondelete="CASCADE"), nullable=False, index=True)
    model = Column(String, nullable=True)
    routerType = Column(String, nullable=True)
    toolCalls = Column(JSONB, nullable=True)
    ragContext = Column(JSONB, nullable=True)
    tokenCount = Column(Integer, nullable=True)

    createdAt = Column(DateTime(timezone=True), nullable=False, default=func.now(), server_default=func.now())
    updatedAt = Column(DateTime(timezone=True), nullable=False, default=func.now(), server_default=func.now(), onupdate=func.now())

    # Relationships
    conversation = relationship("Conversation", back_populates="messages")

class File(Base):
    __tablename__ = "File"

    id = Column(String, primary_key=True, default=generate_cuid)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    size = Column(Integer, nullable=False)
    s3Key = Column(String, nullable=False)
    userId = Column(String, ForeignKey("User.id", ondelete="CASCADE"), nullable=False, index=True)

    createdAt = Column(DateTime(timezone=True), nullable=False, default=func.now(), server_default=func.now())
    updatedAt = Column(DateTime(timezone=True), nullable=False, default=func.now(), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="files")
    documents = relationship("Document", back_populates="file", cascade="all, delete-orphan")

class Document(Base):
    __tablename__ = "Document"

    id = Column(String, primary_key=True, default=generate_cuid)
    content = Column(Text, nullable=False)
    metadata_ = Column("metadata", JSONB, nullable=False, default={})
    embedding = Column(Vector(1536), nullable=True)

    fileId = Column(String, ForeignKey("File.id", ondelete="CASCADE"), nullable=True, index=True)
    conversationId = Column(String, ForeignKey("Conversation.id", ondelete="CASCADE"), nullable=True, index=True)
    userId = Column(String, ForeignKey("User.id", ondelete="CASCADE"), nullable=False, index=True)

    createdAt = Column(DateTime(timezone=True), nullable=False, default=func.now(), server_default=func.now())
    updatedAt = Column(DateTime(timezone=True), nullable=False, default=func.now(), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="documents")
    file = relationship("File", back_populates="documents")
    conversation = relationship("Conversation", back_populates="documents")

class Memory(Base):
    __tablename__ = "Memory"

    id = Column(String, primary_key=True, default=generate_cuid)
    fact = Column(Text, nullable=False)
    category = Column(String, nullable=False, default="general")
    userId = Column(String, ForeignKey("User.id", ondelete="CASCADE"), nullable=False, index=True)

    createdAt = Column(DateTime(timezone=True), nullable=False, default=func.now(), server_default=func.now())
    updatedAt = Column(DateTime(timezone=True), nullable=False, default=func.now(), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="memories")

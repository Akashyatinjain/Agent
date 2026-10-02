import re
from typing import Dict, Any, List, Union

def evaluate_math_expression(expr: str) -> float:
    """Safe Mathematical Expression Evaluator via Shunting-yard + Reverse Polish Notation (RPN).
    No eval() or exec() used.
    """
    clean = expr.replace(' ', '').replace('×', '*').replace('÷', '/').replace('^', '**')

    # Allowed characters: digits, basic operators, parens, percent, decimal
    if not re.match(r'^[0-9+\-*/().,%eE]+$', clean):
        raise ValueError("Expression contains forbidden characters. Only numbers and +, -, *, /, %, () are allowed.")

    # Tokenize
    tokens: List[Union[float, str]] = []
    i = 0
    n = len(clean)
    while i < n:
        char = clean[i]

        if char in '+-*/%()':
            # Handle unary plus / minus
            if (char == '-' or char == '+') and (i == 0 or clean[i - 1] in '+-*/%('):
                num_str = char
                i += 1
                while i < n and (clean[i].isdigit() or clean[i] == '.' or clean[i].lower() == 'e'):
                    num_str += clean[i]
                    i += 1
                try:
                    num = float(num_str)
                    tokens.append(num)
                except ValueError:
                    raise ValueError("Invalid number format in expression.")
                continue

            tokens.append(char)
            i += 1
        elif char.isdigit() or char == '.':
            num_str = ''
            while i < n and (clean[i].isdigit() or clean[i] == '.' or clean[i].lower() == 'e'):
                num_str += clean[i]
                i += 1
            try:
                num = float(num_str)
                tokens.append(num)
            except ValueError:
                raise ValueError("Invalid number format in expression.")
        else:
            raise ValueError(f"Unexpected character '{char}' in math expression.")

    # Shunting-yard infix to postfix (RPN)
    precedence = {'+': 1, '-': 1, '*': 2, '/': 2, '%': 2}
    output_queue: List[Union[float, str]] = []
    operator_stack: List[str] = []

    for token in tokens:
        if isinstance(token, (int, float)):
            output_queue.append(token)
        elif token in precedence:
            while (
                operator_stack
                and operator_stack[-1] in precedence
                and precedence[operator_stack[-1]] >= precedence[token]
            ):
                output_queue.append(operator_stack.pop())
            operator_stack.append(token)
        elif token == '(':
            operator_stack.append(token)
        elif token == ')':
            while operator_stack and operator_stack[-1] != '(':
                output_queue.append(operator_stack.pop())
            if not operator_stack:
                raise ValueError("Mismatched parentheses in expression.")
            operator_stack.pop()  # pop '('

    while operator_stack:
        op = operator_stack.pop()
        if op in ('(', ')'):
            raise ValueError("Mismatched parentheses in expression.")
        output_queue.append(op)

    # Evaluate RPN
    eval_stack: List[float] = []
    for token in output_queue:
        if isinstance(token, (int, float)):
            eval_stack.append(token)
        else:
            if len(eval_stack) < 2:
                raise ValueError("Invalid mathematical expression syntax.")
            b = eval_stack.pop()
            a = eval_stack.pop()

            if token == '+':
                eval_stack.append(a + b)
            elif token == '-':
                eval_stack.append(a - b)
            elif token == '*':
                eval_stack.append(a * b)
            elif token == '/':
                if b == 0:
                    raise ZeroDivisionError("Division by zero.")
                eval_stack.append(a / b)
            elif token == '%':
                eval_stack.append(a % b)
            else:
                raise ValueError(f"Unknown operator '{token}'")

    if len(eval_stack) != 1:
        raise ValueError("Could not evaluate mathematical expression.")

    return eval_stack[0]

async def execute_calculator(user_query: str) -> Dict[str, Any]:
    """Execute safe arithmetic calculation tool."""
    try:
        if not user_query or not isinstance(user_query, str):
            return {
                "success": False,
                "tool": "calculator",
                "error": "No query provided to calculate."
            }

        math_match = user_query
        calc_prefix = re.search(r'(?:calculate|compute|what is|evaluate|solve)\s+(.+)', user_query, re.IGNORECASE)
        if calc_prefix:
            math_match = calc_prefix.group(1).rstrip('?. ')

        clean_chars = re.sub(r'[^0-9+\-*/().,%eE\s]', '', math_match).strip()
        if not clean_chars or not re.search(r'[0-9]', clean_chars):
            return {
                "success": False,
                "tool": "calculator",
                "error": f'Could not extract a valid numerical expression from "{user_query}".'
            }

        calculated_value = evaluate_math_expression(clean_chars)
        # Clean trailing decimals
        clean_result = round(calculated_value, 8)
        if clean_result == int(clean_result):
            clean_result = int(clean_result)

        return {
            "success": True,
            "tool": "calculator",
            "expression": clean_chars,
            "result": clean_result
        }
    except Exception as error:
        return {
            "success": False,
            "tool": "calculator",
            "error": f"Calculation error: {str(error)}"
        }

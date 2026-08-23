/**
 * Safe Mathematical Expression Evaluator
 * Evaluates math expressions without using eval() or Function() constructor to prevent code injection.
 */

// Shunting-yard algorithm + Reverse Polish Notation Evaluator
const evaluateMathExpression = (expr) => {
  // Normalize expression
  let clean = expr
    .replace(/\s+/g, '')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/\^/g, '**');

  // Validate allowed characters only
  if (!/^[0-9+\-*/().,%eE]+$/.test(clean)) {
    throw new Error('Expression contains forbidden characters. Only numbers and +, -, *, /, %, () are allowed.');
  }

  // Tokenize
  const tokens = [];
  let i = 0;
  while (i < clean.length) {
    const char = clean[i];

    if ('+-*/%()'.includes(char)) {
      // Handle unary plus/minus: if at start or immediately after an operator or '('
      if ((char === '-' || char === '+') && (i === 0 || '+-*/%('.includes(clean[i - 1]))) {
        let numStr = char;
        i++;
        while (i < clean.length && (/[0-9.]/.test(clean[i]) || clean[i].toLowerCase() === 'e')) {
          numStr += clean[i];
          i++;
        }
        const num = parseFloat(numStr);
        if (isNaN(num)) throw new Error('Invalid number format in expression.');
        tokens.push(num);
        continue;
      }
      tokens.push(char);
      i++;
    } else if (/[0-9.]/.test(char)) {
      let numStr = '';
      while (i < clean.length && (/[0-9.]/.test(clean[i]) || clean[i].toLowerCase() === 'e')) {
        numStr += clean[i];
        i++;
      }
      const num = parseFloat(numStr);
      if (isNaN(num)) throw new Error('Invalid number format in expression.');
      tokens.push(num);
    } else {
      throw new Error(`Unexpected character '${char}' in math expression.`);
    }
  }

  // Convert infix tokens to postfix (RPN) via Shunting-yard
  const precedence = { '+': 1, '-': 1, '*': 2, '/': 2, '%': 2 };
  const outputQueue = [];
  const operatorStack = [];

  for (const token of tokens) {
    if (typeof token === 'number') {
      outputQueue.push(token);
    } else if (token in precedence) {
      while (
        operatorStack.length > 0 &&
        operatorStack[operatorStack.length - 1] in precedence &&
        precedence[operatorStack[operatorStack.length - 1]] >= precedence[token]
      ) {
        outputQueue.push(operatorStack.pop());
      }
      operatorStack.push(token);
    } else if (token === '(') {
      operatorStack.push(token);
    } else if (token === ')') {
      while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '(') {
        outputQueue.push(operatorStack.pop());
      }
      if (operatorStack.length === 0) {
        throw new Error('Mismatched parentheses in expression.');
      }
      operatorStack.pop(); // Pop '('
    }
  }

  while (operatorStack.length > 0) {
    const op = operatorStack.pop();
    if (op === '(' || op === ')') {
      throw new Error('Mismatched parentheses in expression.');
    }
    outputQueue.push(op);
  }

  // Evaluate Postfix (RPN)
  const evalStack = [];
  for (const token of outputQueue) {
    if (typeof token === 'number') {
      evalStack.push(token);
    } else {
      if (evalStack.length < 2) throw new Error('Invalid mathematical expression syntax.');
      const b = evalStack.pop();
      const a = evalStack.pop();

      switch (token) {
        case '+': evalStack.push(a + b); break;
        case '-': evalStack.push(a - b); break;
        case '*': evalStack.push(a * b); break;
        case '/':
          if (b === 0) throw new Error('Division by zero.');
          evalStack.push(a / b);
          break;
        case '%': evalStack.push(a % b); break;
        default: throw new Error(`Unknown operator '${token}'`);
      }
    }
  }

  if (evalStack.length !== 1 || isNaN(evalStack[0])) {
    throw new Error('Could not evaluate mathematical expression.');
  }

  return evalStack[0];
};

export const executeCalculator = async (userQuery) => {
  try {
    if (!userQuery || typeof userQuery !== 'string') {
      return {
        success: false,
        tool: 'calculator',
        error: 'No query provided to calculate.'
      };
    }

    // Extract mathematical portion from query
    let mathMatch = userQuery;
    const calcPrefix = userQuery.match(/(?:calculate|compute|what is|evaluate|solve)\s+(.+)/i);
    if (calcPrefix && calcPrefix[1]) {
      mathMatch = calcPrefix[1].replace(/[\?\.]$/, '');
    }

    const cleanChars = mathMatch.replace(/[^0-9+\-*/().,%eE\s]/g, '').trim();
    if (!cleanChars || !/[0-9]/.test(cleanChars)) {
      return {
        success: false,
        tool: 'calculator',
        error: `Could not extract a valid numerical expression from "${userQuery}".`
      };
    }

    const calculatedValue = evaluateMathExpression(cleanChars);

    return {
      success: true,
      tool: 'calculator',
      expression: cleanChars,
      result: Number(Number(calculatedValue).toFixed(8)) / 1 // Clean trailing decimals
    };
  } catch (error) {
    return {
      success: false,
      tool: 'calculator',
      error: `Calculation error: ${error.message}`
    };
  }
};

export default executeCalculator;

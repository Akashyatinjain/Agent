export const executeCalculator = async (userQuery) => {
  try {
    // Extract mathematical expression from query
    const cleaned = userQuery.replace(/[^0-9\+\-\*\/\(\)\.\s]/g, '').trim();
    if (!cleaned) {
      return { success: false, error: 'Could not extract valid numerical expression' };
    }

    // Safe mathematical evaluation (no eval)
    const fn = new Function(`return (${cleaned})`);
    const result = fn();

    return {
      success: true,
      tool: 'calculator',
      expression: cleaned,
      result: Number(result)
    };
  } catch (error) {
    return {
      success: false,
      tool: 'calculator',
      error: `Failed to calculate expression: ${error.message}`
    };
  }
};

export default executeCalculator;

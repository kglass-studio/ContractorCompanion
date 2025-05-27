export const handler = async (event, context) => {
    const { default: expressApp } = await import('../../dist/index.js');
    const { default: serverless } = await import('serverless-http');
    const handler = serverless(expressApp);
    return handler(event, context);
  };
import Koa from 'koa';
function errorHandler(ctx:Koa.Context, next: () => Promise<any>) {
    return next().catch((err) => {
        ctx.status = err.status || 500;
        ctx.body = {
            message: err.message
        };
        ctx.app.emit('error', err, ctx);
    });
}

export {errorHandler};

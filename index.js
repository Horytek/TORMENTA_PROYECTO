// index.js
import app from './src/app';

const main = () => {
    app.listen(app.get('port'), '0.0.0.0', () => {
        console.log(`Server started on http://0.0.0.0:${app.get('port')}`);
    });
    console.log(`Server started`);
}

main();
// index.js
import app from './src/app';

const main = () => {
    app.listen(app.get('port'));
    console.log(`Server started`);
}

main();
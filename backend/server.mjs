import 'dotenv/config';
import app from './src/app.mjs';

app.listen(3000,() => {
	console.log("server running");
});

import express from 'express';
import bodyParser from 'body-parser';
import pg from 'pg';

const app = express();
const port = 3000;

const db = new pg.Client({
	user: 'postgres',
	host: 'localhost',
	database: 'world',
	password: '20072023',
	port: 5432,
});

db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

async function checkVisited() {
	const result = await db.query('SELECT country_code FROM visited_countries');
	let countries = result.rows.map((country) => country.country_code);
	return countries;
}

app.get('/', async (req, res) => {
	const countries = await checkVisited();
	res.render('index.ejs', {
		countries: countries,
		total: countries.length,
	});
});

app.post('/add', async (req, res) => {
	const answer = req.body.country;
	try {
		const result = await db.query(
			"SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
			[answer.toLowerCase()]
		);
		const data = result.rows[0];
		const countryCode = data.country_code;

		try {
			await db.query(
				'INSERT INTO visited_countries (country_code) VALUES ($1)',
				[countryCode]
			);
			res.redirect('/');
		} catch (err) {
			const countries = checkVisited();
			res.render('index.ejs', {
				countries: countries,
				total: (await countries).length,
				error: 'Country has already been added, try again.',
			});
		}
	} catch (err) {
		const countries = await checkVisited();
		res.render('index.ejs', {
			countries: countries,
			total: countries.length,
			error: 'Country name does not exist, try again.',
		});
	}
});

app.listen(port, () => {
	console.log(`Server running on http://localhost:${port}`);
});

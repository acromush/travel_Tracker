import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "country",
  password: "boomboom69",
  port: 5432,
});

db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

async function getCountries() {
  const result = await db.query("SELECT country_code from visited_countries");
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}

app.get("/", async (req, res) => {
  try {
    const countries = await getCountries();
    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      color: "teal",
    });
  } catch (error) {
    console.error("Error fetching countries:", error);
    res.status(500).send("Error fetching countries");
  }
});

async function addCountry(req, res , color) {
  let answer1 = req.body.country; //gets the user input
  let answer2 = answer1[0].toUpperCase();
  answer1 = answer2 + answer1.slice(1); // Capitalize first letter
  const query =
    "SELECT country_code1 FROM country_visited WHERE country_name = $1";
  const values = [answer1]; //gets the country code

  const result = await db.query(query, values); // the country code
  if (result.rows.length > 0) {
    const answer3 = result.rows[0].country_code1;
    // Check if country exists before inserting
    const checkQuery =
      "SELECT * FROM visited_countries WHERE country_code = $1";
    const checkValues = [answer3];
    const checkResult = await db.query(checkQuery, checkValues);

    if (checkResult.rows.length > 0) {
      // if country hasn't been added
      // Country already exists, send appropriate message
      const countries = await getCountries();
      const error = "Country already has been marked";
      res.render("index.ejs", {
        countries: countries,
        total: countries.length,
        color: "teal",
        error: error,
      });
    } else {
      const query = `
    INSERT INTO visited_countries (country_code)
    SELECT country_code1
    FROM country_visited
    WHERE LOWER(country_name) LIKE '%' || $1 || '%';
  `;
   // if country hasn't added yet , adds it
      const values = [answer1.toLowerCase()];
      const result = await db.query(query, values);
      res.redirect("/"); // Or send a success message (optional)
    }
  } else {
    const countries = await getCountries();
    const error = "country doesn't exist"; // if country name doesn't match with any country code
    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      color: backgroundColor,
      error: error,
    });
  }
}

app.post("/add", async (req, res) => {
  const backgroundColor = "teal"
  await addCountry(req, res, backgroundColor); // Call the addCountry function
});

app.post("/user", async (req, res) => {
  res.render("new.ejs");
  app.post("/new", async (req, res) => {
    let memberName = req.body.name;
    let backgroundColor = req.body.color;
    const countries = await getCountries();
    const tableName = [memberName + "'s visited_countries"];
    console.log(backgroundColor);
    console.log(tableName);
    await db.query(`CREATE TABLE IF NOT EXISTS ${tableName} (id SERIAL PRIMARY KEY,country_code CHAR(2) )`);
    
    // res.render("index.ejs", {
    //   countries: countries,
    //   total: countries.length,
    //   color: backgroundColor,
    // });
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

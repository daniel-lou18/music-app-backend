const dotenv = require("dotenv");
const app = require("./app");
const mongoose = require("mongoose");

dotenv.config({ path: "./config.env" });

mongoose
  .connect(
    process.env.DATABASE.replace("<PASSWORD>", process.env.DB_PASSWORD),
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("Successfully connected to database"))
  .catch((err) => console.error(err));

const PORT = process.env.PORT;
console.log(`Node environment: ${process.env.NODE_ENV}`);

app.listen(PORT, () => console.log(`Server is listening on port: ${PORT}`));

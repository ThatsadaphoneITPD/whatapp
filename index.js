const express =require("express")
const app = express();

app.use("/", (req, res)=>{
    res.send("Server is running.")
})


const port = 8087;
const env = 'production'

// Start the server
if ( env == 'production') {
  app.listen(port, () => {
    console.log(`Server on http://localhost:${port}`);
  });
}
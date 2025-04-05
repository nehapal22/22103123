const express = require('express');
const fetch = require('node-fetch'); // for older Node versions
const app = express();

// config stuff
const PORT = 9876;
const myToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzQzODMwNjU3LCJpYXQiOjE3NDM4MzAzNTcsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6IjEzOTU0MjIwLTc4NWQtNGY0ZS1iOGRkLTIyYmIxZGE3YWMzOCIsInN1YiI6IjIyMTAzMTIzQG1haWwuamlpdC5hYy5pbiJ9LCJlbWFpbCI6IjIyMTAzMTIzQG1haWwuamlpdC5hYy5pbiIsIm5hbWUiOiJuZWhhIHBhbCIsInJvbGxObyI6IjIyMTAzMTIzIiwiYWNjZXNzQ29kZSI6IlNyTVFxUiIsImNsaWVudElEIjoiMTM5NTQyMjAtNzg1ZC00ZjRlLWI4ZGQtMjJiYjFkYTdhYzM4IiwiY2xpZW50U2VjcmV0IjoiVUVGZ2ZFZEJHZXBjU2FYWCJ9.jGR0TdJvJehR8BKMnwRFVYWxxVIIyWxHOjT3o07Ck2o";

// window state tracking
let oldWindow = [];
let currWindow = [];
const maxWinSize = 10;

// get numbers from the external API
async function getNumbersFromApi(numberType) {
  try {
    // form the URL based on type
    let apiUrl = `http://20.244.56.144/test/numbers/${numberType}`;
    
    // make the request with auth header
    let resp = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${myToken}`
      },
      timeout: 500  // timeout after 500ms
    });
    
    // check if request was successful
    if (!resp.ok) {
      console.log(`API request failed: ${resp.status}`);
      return [];
    }
    
    // parse the response
    let data = await resp.json();
    return data.numbers || [];  // return empty array if no numbers
  } catch (err) {
    // log any errors and return empty array
    console.log('Failed to get numbers:', err.message);
    return [];
  }
}

// update the window with new numbers
function updateWindowWithNumbers(newNums) {
  // save current state as previous
  oldWindow = [...currWindow];
  
  // filter out duplicates
  let uniqueOnes = [];
  for(let i = 0; i < newNums.length; i++) {
    if(!currWindow.includes(newNums[i])) {
      uniqueOnes.push(newNums[i]);
    }
  }
  
  // combine current window with new unique numbers
  let allNums = [...currWindow, ...uniqueOnes];
  
  // trim if exceeding window size
  if(allNums.length > maxWinSize) {
    allNums = allNums.slice(allNums.length - maxWinSize);
  }
  
  // update current window
  currWindow = allNums;
}

// calculate average of current window
function calcAvg() {
  if(currWindow.length === 0) return 0;
  
  let sum = 0;
  for(let i = 0; i < currWindow.length; i++) {
    sum += currWindow[i];
  }
  
  // round to 2 decimal places
  return Number((sum / currWindow.length).toFixed(2));
}

// API endpoint
app.get("/numbers/:type", async (req, res) => {
  // get number type from URL
  const numType = req.params.type;
  
  // map of valid types
  const validTypes = { 
    p: "primes", 
    f: "fibo", 
    e: "even", 
    r: "rand" 
  };
  
  // check if valid type
  if(!validTypes[numType]) {
    return res.status(400).json({ error: "Invalid number type!" });
  }
  
  // fetch numbers from API
  const nums = await getNumbersFromApi(validTypes[numType]);
  
  // update window with new numbers
  updateWindowWithNumbers(nums);
  
  // calc average
  const average = calcAvg();
  
  // send response
  res.json({
    windowPrevState: oldWindow,
    windowCurrState: currWindow,
    numbers: nums,
    avg: average
  });
});

// health check endpoint
app.get("/", (req, res) => {
  res.send("Server is running!");
});

// start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
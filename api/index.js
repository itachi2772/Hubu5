const http = require("http");
const https = require("https");
const zlib = require("zlib");

module.exports = async (req, res) => {
  // CORS Headers (Sabhi domains ke liye allow karne ke liye)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  const fetchData = (url, headers) =>
    new Promise((resolve, reject) => {
      const lib = url.startsWith("https") ? https : http;
      const request = lib.get(url, { headers }, (response) => {
        let chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => {
          const buffer = Buffer.concat(chunks);
          const encoding = response.headers["content-encoding"];
          
          try {
            if (encoding === "gzip") {
              zlib.gunzip(buffer, (err, decoded) => {
                if (err) return reject(err);
                resolve(decoded.toString());
              });
            } else if (encoding === "deflate") {
              zlib.inflate(buffer, (err, decoded) => {
                if (err) return reject(err);
                resolve(decoded.toString());
              });
            } else {
              resolve(buffer.toString());
            }
          } catch (e) {
            reject(e);
          }
        });
      });
      request.on("error", reject);
    });

  // URL parameters nikalne ke liye
  const { searchParams } = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const type = searchParams.get("type");

  if (!type) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: "Please use ?type=sms or ?type=numbers" }));
  }

  const baseIP = "217.182.195.194";
  
  // Aapka naya Session ID yahan hai
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "X-Requested-With": "XMLHttpRequest",
    "Accept-Language": "en-US,en;q=0.9",
    "Cookie": "PHPSESSID=2n0ua218gtncoi5puur41cbla6", 
    "Connection": "keep-alive"
  };

  let targetUrl;
  if (type === "numbers") {
    targetUrl = `http://${baseIP}/ints/client/res/data_smsnumbers.php?sEcho=1&iDisplayStart=0&iDisplayLength=100`;
    headers.Referer = `http://${baseIP}/ints/client/MySMSNumbers`;
  } else if (type === "sms") {
    // Date range ko wide rakha hai taaki zyada data mile
    targetUrl = `http://${baseIP}/ints/client/res/data_smscdr.php?fdate1=2024-01-01&fdate2=2030-12-31&sEcho=1&iDisplayStart=0&iDisplayLength=100`;
    headers.Referer = `http://${baseIP}/ints/client/SMSCDRStats`;
  } else {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: "Invalid type parameter" }));
  }

  try {
    const data = await fetchData(targetUrl, headers);
    res.end(data);
  } catch (err) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "Server Error", details: err.message }));
  }
};

// Node.js 24+ modern handler
export default async function handler(req, res) {
  // 1. CORS Headers: Taaki aap isse kisi bhi website ya app se connect kar saken
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  // OPTIONS request handle karein (Browser pre-flight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2. URL Parameters extract karein
  const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
  const type = searchParams.get("type");

  if (!type) {
    return res.status(400).json({ 
      error: "Missing parameter", 
      usage: "Add ?type=sms or ?type=numbers to your URL" 
    });
  }

  // 3. Configuration
  const baseIP = "217.182.195.194";
  const sessionID = "2n0ua218gtncoi5puur41cbla6"; // Aapka diya hua session
  
  const commonHeaders = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "X-Requested-With": "XMLHttpRequest",
    "Cookie": `PHPSESSID=${sessionID}`,
    "Connection": "keep-alive"
  };

  let targetUrl = "";

  // 4. Logic for different types
  if (type === "numbers") {
    targetUrl = `http://${baseIP}/ints/client/res/data_smsnumbers.php?sEcho=1&iDisplayStart=0&iDisplayLength=1000`;
  } else if (type === "sms") {
    // 2024 se 2030 tak ka saara data fetch karega
    targetUrl = `http://${baseIP}/ints/client/res/data_smscdr.php?fdate1=2024-01-01&fdate2=2030-12-31&sEcho=1&iDisplayStart=0&iDisplayLength=1000`;
  } else {
    return res.status(400).json({ error: "Invalid type. Use 'sms' or 'numbers'" });
  }

  try {
    // 5. Fetching data from the server
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: commonHeaders
    });

    if (!response.ok) {
      throw new Error(`Server returned status: ${response.status}`);
    }

    const rawData = await response.text();

    // 6. Response Parsing
    try {
      const jsonData = JSON.parse(rawData);
      return res.status(200).json(jsonData);
    } catch (parseError) {
      // Agar response JSON nahi hai (shayad session expire ho gaya ho)
      return res.status(200).send(rawData);
    }

  } catch (error) {
    console.error("Fetch Error:", error.message);
    return res.status(500).json({ 
      error: "Failed to fetch data", 
      details: error.message,
      tip: "Check if your PHPSESSID is still valid"
    });
  }
}

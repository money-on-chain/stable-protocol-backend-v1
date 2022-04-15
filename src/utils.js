const fs = require('fs');
const Web3 = require('web3');


const readJsonFile = (path) => {
  console.log('Read json path: ', path);
  let config;

  if (fs.existsSync(path)) {
    const rawdata = fs.readFileSync(path);
    config = JSON.parse(rawdata);
  } else {
    throw new Error(`Missing json file.`);
  }
  return config;
};

const getWeb3 = (host_uri) => {
    
  const web3 = new Web3(host_uri);

  return web3;
}

const getGasPrice = async (web3) => {
  try {      
      const gasPrice = await web3.eth.getGasPrice();
      //gasPrice = web3.utils.fromWei(gasPrice);
      return gasPrice;
  } catch (e) {
      console.log(e);
  }
};


module.exports = {
    readJsonFile,
    getWeb3,
    getGasPrice
};
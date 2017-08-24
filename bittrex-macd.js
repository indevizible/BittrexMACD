var bittrex = require('node.bittrex.api');
const EMA = require('technicalindicators').EMA;
var moment = require('moment');
var CronJob = require('cron').CronJob;

bittrex.options({
  'apikey' : 'API',
  'apisecret' : 'SECRET', 
});

let config = {
  market: 'ZEC'
}

//BUY LBC
function buy(price) {
  bittrex.getbalance({ currency : 'BTC' }, function( data, err ) {
    if (err) {
      return console.error(err);
    }
    bittrex.buylimit({market: 'BTC-' + config.market, quantity: data.result.Available / price, rate: price}, function (data, err) {
      if (err) {
        return console.error(err);
      }
      console.log( data );
    })
  });
}

//SELL LBC
function sell() {
  bittrex.getbalance({ currency : config.market }, function( data, err ) {
    if (err) {
      return console.error(err);
    }
    bittrex.selllimit({market: 'BTC-' + config.market, quantity: data.result.Available , rate: price}, function (data, err) {
      if (err) {
        return console.error(err);
      }
      console.log( data );
    })
  });
}

function calc() {
    bittrex.getcandles({
    marketName: 'BTC-' + config.market,
    tickInterval: 'hour',
    _: ((new Date()).getTime()/1000)-(300*5)
  }, function(data, err) {
    if (err) {
      return console.error(err);
    }
    let result = data.result;
    let ohlc4 = result.map ((v) => { return (v.O + v.H + v.L +v.C)/4})
    var Fast = EMA.calculate({period : 12, values : ohlc4});
    var Slow = EMA.calculate({period : 26, values : ohlc4});

    Fast = [0,0,0,0,0,0,0,0,0,0,0,0,].concat(Fast);
    Slow = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,].concat(Slow);

    let date = dateFromT(result[result.length - 1].T)
    let len = AP.length
    var lastColor = 'w';
    let colorBar = [];
    for(i = Math.max(len-10,26); i< len; i++) {
      let green = Fast[i] > Slow[i] 
      let red = Fast[i] < Slow[i] 
      if(green) {
        lastColor = 'g';
        colorBar.push('g');
      }else if(red) {
        lastColor = 'r';
        colorBar.push('r');
      }else{
        colorBar.push(lastColor);
      }
    }

    if(colorBar[colorBar.length-1] == 'r') {
      buy(result[result.length - 1].C * 1.002)
    }else if(colorBar[colorBar.length-1] == 'g'){
      sell(result[result.length - 1].C * 0.998)
    }
    console.log(colorBar);
  });

}

new CronJob('5 0 * * * *', calc, null, true);

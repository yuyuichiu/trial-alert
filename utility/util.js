const isValidDate = function (input) {
  if(typeof input === 'undefined'){ return false }
  if(!input.match(/[0-9]{4}-[0-9]{2}-[0-9]{2}/)) {
    return false
  }

  let year = +input.slice(0,4);
  let month = +input.slice(5,7);
  let day = +input.slice(8,10);

  if(isNaN(year) || isNaN(month) || isNaN(day)) {
    return false
  }

  if(
    (month <= 0 && month > 12) ||
    (day <= 0 && day > 31) ||
    year % 4 === 0 && month === 2 && day > 29 || 
    year % 4 !== 0 && month === 2 && day > 28 ||
    [1,3,5,7,8,10,12].includes(month) && day > 31 ||
    [4,6,9,11].includes(month) && day > 30
  ){
    return false
  }

  return true
}

const isValidTime = function (input) {
  if(typeof input === 'undefined'){ return false }
  if(!input.match(/[0-9]{2}:[0-9]{2}/)) {
    return false
  }
  
  let hour = +input.slice(0,2);
  let min = +input.slice(3,5);

  if(isNaN(hour) || isNaN(min) || hour < 0 || hour >= 24 || min < 0 || min >= 60){
    return false
  }

  return true
}

module.exports = { isValidDate, isValidTime }
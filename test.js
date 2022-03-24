let samples = ['apple', 'song', 'nike', 'cold', 'bonk', 'cheese', 'foo', 'bar', 'zebra', 'dog']

// Simple sort
function simpleSort(data, isDesc) {
  let result = [...data];
  let temp;

  for(let i = 0; i < data.length; i++) {
    for(let j = i+1; j < data.length; j++){
      if((isDesc && result[i] < result[j]) || (!isDesc && result[i] > result[j])) {
        temp = result[j];
        result[j] = result[i];
        result[i] = temp;
      }
    }
  }
  
  console.log(result)
  return result
}

// Selection sort (one iteration to loop over whole array at a time, put the comp item to the left)
// O(n^2), never use this.
function selectionSort(data, isDesc) {
  let result = [...data];

  // Find the lowest/highest in every iteration and put it on the left.
  for(let i = 0; i < result.length; i++) {
    let pos = i;
    for(let j = i+1; j < result.length; j++) {
      if((!isDesc && result[j] < result[pos]) || (isDesc && result[j] > result[pos])){
        pos = j;
      }
    }

    let temp = result[i];
    result[i] = result[pos];
    result[pos] = temp;
  }

  console.log(result);
  return result
}

// Merge sort, 
// O(n long(n)) -- faster.
function mergeSort(data, isDesc) {


  console.log(result);
  return result
}

selectionSort(samples, true);
selectionSort(samples);
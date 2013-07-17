_.mixin({
  pickRandom: function(array, n, guard) {
    if (n == null  || guard)
       return array[Math.floor(Math.random() * array.length)];
 
    n = Math.max(0, Math.min(array.length, n));
 
    return (function pickR(array, n, length) {
      var i, picked, rest, hasIndex;
 
      if (n === 0) return [];
 
      i = Math.floor(Math.random() * length);
      hasIndex = array.hasOwnProperty(i);	// This is needed for restoration of dense arrays
      picked = array[i];
      array[i] = array[length - 1];
      rest = pickR(array, n - 1, length - 1);
      // Restore array
      if (hasIndex) {
        array[i] = picked;
       } else {
        delete array[i];
      }
      rest.push(picked);
      return rest;
    }) (array, n, array.length);
  }
});
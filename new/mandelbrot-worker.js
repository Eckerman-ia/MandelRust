let /* boolean */ highPrecision;
let /* int */ maxIterations, jobNumber, workerNumber;

let ArrayType = this.Uint32Array || Array;
let url = "http://localhost:8081/v1/mandelbrot/compute";

function fetchIterationCounts(coords) {
    let client = new XMLHttpRequest();
    client.open("POST", url, false);
    client.setRequestHeader("Content-Type", "application/json");
    client.setRequestHeader("Accept", "application/json");
    client.send(JSON.stringify(coords));

    if (client.status == 200) {
        return JSON.parse(client.response);
    } else {
        console.error(client);
        let iterationCounts = [];
        for (let i = 0; i < coords.columns; i++) {
            iterationCounts[i] = -1;
        }
        return iterationCounts;
    }
}

onmessage = function(msg) {
    let data = msg.data;
    if ( data[0] == "setup" ) {
        jobNumber = data[1];
        maxIterations = data[2];
        highPrecision = data[3];
        workerNumber = data[4];
    } else if ( data[0] == "task" ) {
        let taskNumber = data[1];
        let columnCount = data[2];
        let xmin = data[3];
        let dx = data[4];
        let yval = data[5];
        let iterationCounts;
        if (highPrecision) {
            iterationCounts = new Array(columnCount);
            createHPData(xmin, dx, columnCount);
            for (let i = 0; i < columnCount; i++)
                iterationCounts[i] = countIterationsHP(xs[i], yval);
        } else {
            iterationCounts = fetchIterationCounts({
                highPrecision: highPrecision, y: yval, xmin: xmin, dx: dx, columns: columnCount, maxIterations: maxIterations
            });
            /*
            iterationCounts = new Array(columnCount);
            for (let i = 0; i < columnCount; i++)
                iterationCounts[i] = countIterations(xmin + dx*i, yval);
            */
        }
        let returnData = [ jobNumber, taskNumber, iterationCounts, workerNumber ];
        postMessage(returnData);
    }
}


function countIterations( /* double */ x, /* double */ y) {
    var count = 0;
    var zx = x;
    var zy = y;
    while (count < maxIterations
            && zx*zx + zy*zy < 8) {
        var new_zx = zx*zx - zy*zy + x;
        zy = 2*zx*zy + y;
        zx = new_zx;
        count++;
    }
    return (count < maxIterations)? count : -1 ;
}

function countIterationsHP( /* Uint32Array */ x, /* Uint32Array */ y) {
    arraycopy(x,0,zx,0,chunks);
    arraycopy(y,0,zy,0,chunks);
    var count = 0;
    while (count < maxIterations) {
        arraycopy(zx, 0, work2, 0, chunks);
        multiply(work2,zx,chunks);  // work2 = zx*zx
        arraycopy(zy, 0, work1, 0, chunks);
        multiply(work1,zy,chunks);  // work1 = zy*zy
        arraycopy(work1,0,work3,0,chunks);   // work3 = zy*zy, save a copy.  (Note: multiplication uses work3.)
        add(work1,work2,chunks);  // work1 = zx*zx + zy*zy
        if ((work1[0] & 0xFFF8) != 0 && (work1[0] & 0xFFF8) != 0xFFF0)
            break;
        negate(work3,chunks);  // work3 = -work3 = -zy*zy
        add(work2,work3,chunks);  // work2 = zx*zx - zy*zy
        add(work2,x,chunks); // work2 = zx*zx - zy*zy + x, the next value for zx
        arraycopy(zx,0,work1,0,chunks);  // work1 = zx
        add(work1,zx,chunks);  // work1 = 2*zx
        multiply(work1,zy,chunks);  // work1 = 2*zx*zy
        add(work1,y,chunks);  // work1 = 2*zx*zy + y, the next value for zy
        arraycopy(work1,0,zy,0,chunks);  // zy = work1
        arraycopy(work2,0,zx,0,chunks);  // zx = work2
        count++;
    }
    return (count < maxIterations)? count : -1 ;
}

function arraycopy( sourceArray, sourceStart, destArray, destStart, count ) {
   for (var i = 0; i < count; i++) {
       destArray[destStart + i] = sourceArray[sourceStart + i];
   }
}


// ------- support for high-precision calculation ------------

var  /* int[][] */ xs;
var /* int[] */ y;

var /* int[] */ work1,work2,work3;
var /* int[] */ zx, zy;

var /* int */ chunks;

var /* double */ log2of10 = Math.log(10)/Math.log(2);

function createHPData(xmin, dx, columnCount) {
    chunks = xmin.length - 1;
    y = new ArrayType(chunks+1);
    xs = new Array(columnCount);
    xs[0] = xmin; // must have xs.length = chunks+1
    for (var i = 1; i < columnCount; i++) {
        xs[i] = new ArrayType(chunks+1);
    }
    if (columnCount > 1) {
        for (var i = 1; i < columnCount; i++) {
            for (var j = 0; j <= chunks; j++) {
                xs[i][j] = xs[i-1][j];
            }
            add(xs[i],dx,chunks+1);
        }
    }
    zx = new ArrayType(chunks);
    zy = new ArrayType(chunks);
    work1 = new ArrayType(chunks);
    work2 = new ArrayType(chunks);
    work3 = new ArrayType(chunks);
}

function add( /* int[] */ x, /* int[] */ dx, /* int */ count) {
    var carry = 0;
    for (var i = count - 1; i >= 0; i--) {
        x[i] += dx[i];
        x[i] += carry;
        carry = x[i] >>> 16;
        x[i] &= 0xFFFF;
    }
}

function multiply( /* int[] */ x, /* int[] */ y, /* int */ count){  // Can't allow x == y !
    var neg1 = (x[0] & 0x8000) != 0;
    if (neg1)
        negate(x,count);
    var neg2 = (y[0] & 0x8000) != 0;
    if (neg2)
        negate(y,count);
    if (x[0] == 0) {
        for (var i = 0; i < count; i++)
            work3[i] = 0;
    }
    else {
        var carry = 0;
        for (var i = count-1; i >= 0; i--) {
            work3[i] = x[0]*y[i] + carry;
            carry = work3[i] >>> 16;
            work3[i] &= 0xFFFF;
        }
    }
    for (var j = 1; j < count; j++) {
        var i = count - j;
        var carry = (x[j]*y[i]) >>> 16;
        i--;
        var k = count - 1;
        while (i >= 0) {
            work3[k] += x[j]*y[i] + carry;
            carry = work3[k] >>> 16;
            work3[k] &= 0xFFFF;
            i--;
            k--;
        }
        while (carry != 0 && k >= 0) {
            work3[k] += carry;
            carry = work3[k] >>> 16;
            work3[k] &= 0xFFFF;
            k--;
        }
    }
    arraycopy(work3,0,x,0,count);
    if (neg2)
        negate(y,count);
    if (neg1 != neg2)
        negate(x,count);
}

function negate( /* int[] */ x, /* int */ chunks) {
    for (var i = 0; i < chunks; i++)
        x[i] = 0xFFFF-x[i];
    ++x[chunks-1];
    for (var i = chunks-1; i > 0 && (x[i] & 0x10000) != 0; i--) {
        x[i] &= 0xFFFF;
        ++x[i-1];
    }
    x[0] &= 0xFFFF;
}
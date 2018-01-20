const Promise = require('bluebird');

const path = require('path');

const fsCb = require('fs')

const fsAsync = Promise.promisifyAll(fsCb);

let catPdfBinary, dirTwoMessage;

const catInPdfOnePath = path.resolve(`${process.cwd()}/dir-one/cat-one.pdf`);

const dirTwo = `${process.cwd()}/dir-two`;

const readCatPdfFromOneBinary = fsAsync.readFileAsync(catInPdfOnePath, 'binary'); //prom takes error, data

const createDirTwo = fsAsync.mkdirAsync(dirTwo); //prom only takes error

const writeToDirTwo = (dir, data) => {
	let fileName = path.resolve(`${dir}/message.txt`);
	return fsAsync.writeFileAsync(fileName, data, 'utf8');
} //prom only takes error

const plainFunction = (a, b) => {
	return a + b;
}

const promArr1 = [readCatPdfFromOneBinary, createDirTwo];
//this arr has only promise-returning functions

let mixedArr = ['foo', {bar: 1}, true, false];
//later we'll Promise.map over it to return an array of promises


const promise1 = function() {
	//read cat-one from directory cat-one and simultaneously create directory pdf-two
	return Promise.all(promArr1)
	.then((resultArr) => {
		console.log(resultArr);
		if(resultArr[0]) {
			catPdfBinary = resultArr[0]; //this is the binary file returned from reading cat pdf one assigned to a variable outside the .then method block scope for later use without explicitly returning the value to the next .then method block
			const dirTwoPath = path.resolve(dirTwo);
			return fsAsync.statAsync(dirTwoPath) //test if the directory is there
		} else {
			return Promise.reject(new Error(`readFileAsync for dir-one/cat-one returned ${resultArr[0]} and mkdir returned ${resultArr[1]} but neither threw an error`));
		}
	})
	.then((stat) => {
		console.log(stat);
		if(stat && catPdfBinary) {
			return Promise.resolve(`We read the cat pdf binary and created the directory!`)
		} else {
			return Promise.reject(new Error(`stat returned ${stat} but didn't throw an error; binaryTest is ${binaryTest}`));
		}
	})
	.catch((err) => {
		//console.log('foo');
		//console.log(err);
		if((err.code === 'EEXIST')) {
			return Promise.resolve(`The directory already existed, but we have no idea if the file was read because we used Promise.all and one index was rejected!`);
		} else {
			console.log(`error hit .catch method in promise1 with error message ${err.message}`)
			return Promise.reject(err);
		}
	});
}

const promise2 = function() {
	return promise1()
	.then((result) => {
		console.log(result);
		dirTwoMessage = result;
	})
	.catch((err) => {
		console.log(`hit the .catch method block in promise2 with error message ${err.message}`)
		return Promise.reject(err);
	});
}

const promise3 = function() {
	return promise2()
	.then((result) => {
		console.log(`promise.resolve called in promise2`);
		//now we're mapping mixedArr to return an array of promises based on the values of mixedArr
		let promMap = Promise.map(mixedArr, item => {
			if(typeof(item) == 'string') {
				return Promise.resolve(item);
			} else if (item.bar) {
				return Promise.resolve(item.bar);
			} else if (item) {
				//promise returning function
				return writeToDirTwo(dirTwo, dirTwoMessage);
			} else {
				return Promise.resolve(plainFunction(3, 5));
			}
		});
		return Promise.all(promMap);
	})
	.then(([str, value, write, arithmetic]) => {
		console.log(`str is ${str}`); //we're expecting foo
		console.log(`value is ${value}`); //we're expecting 1
		console.log(`write is ${write}`);  //we're expecting undefined, but check the contents of the pdf-two dir
		console.log(`arithmetic is ${arithmetic}`); //we're expecting 8
		console.log('all promises fired successfully!');
		return Promise.resolve(true);
	})
	.catch((err) => {
		console.log(`hit the .catch method block in promise3 with error message ${err.message} in promise3`);
		return Promise.resolve(`promise resolved with error: ${err.message}`);
	});
}

promise3();

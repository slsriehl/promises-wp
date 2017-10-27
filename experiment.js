const Promise = require('bluebird');

const path = require('path');

const fsCb = require('fs')

const fsAsync = Promise.promisifyAll(fsCb);

let catPdfBinary;
const catInPdfOnePath = path.resolve(`${process.cwd()}/pdf-one/cat-one.pdf`);
const readCatPdfFromOne = fsAsync.readFileAsync(catInPdfOnePath, 'binary'); //prom takes error, data
const createPdfTwo = fsAsync.mkdirAsync(`${process.cwd()}/pdf-two`); //prom only takes error
const promArr = [readCatPdfFromOne, createPdfTwo];

const promise1 = function() {
	//read cat-one from directory cat-one and simultaneously create directory pdf-two
	return Promise.all(promArr)
	.then((resultArr) => {
		console.log(resultArr);
		if(resultArr[0]) {
			catPdfBinary = resultArr[0]; //this is the binary file returned from reading cat pdf one assigned to a variable outside the .then method block scope for later use without explicitly returning the value to the next .then method block
			const pdfTwoPath = path.resolve(`${process.cwd()}/pdf-two`);
			return fsAsync.statAsync(pdfTwoPath) //test if the directory is there
		} else {
			return Promise.reject(new Error(`readFileAsync for pdf-one/cat-one returned ${resultArr[0]} and mkdir returned ${resultArr[1]} but neither threw an error`));
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
			return Promise.reject(`error hit .catch method in promise1 as ${err}`);
		}
	});
}

const promise2 = function() {
	return promise1()
	.then((result) => {
		console.log(result);
		if(result === `The directory already existed, but we have no idea if the file was read because we used Promise.all and one index was rejected!`) {
			return Promise.resolve(readCatPdfFromOne) //this will return the pdf binary or an error
		} else {
			return Promise.resolve(result); //this won't be a binary file
		}
	})
	.then((catPdfResultOrPreviousSuccess) => {
		//console.log(catPdfResultOrPreviousSuccess);
		if(catPdfResultOrPreviousSuccess === `We read the cat pdf binary and created the directory!`) {
			return Promise.resolve(catPdfResultOrPreviousSuccess); //this will return the result from the last .then method block
		} else if(catPdfResultOrPreviousSuccess) {
			return Promise.resolve(`the directory already existed, so we don't know if the file was read the first time, but it was read the second time!`);
		} else {
			return Promise.reject(new Error(`catPdfResultOrPreviousSuccess returned ${catPdfResultOrPreviousSuccess} but didn't throw an error`));
		}
	})
	.catch((err) => {
		return Promise.reject(new Error(`hit the .catch method block in promise2 with error: ${err}`));
	});
}

const promise3 = function() {
	return promise2()
	.then((result) => {
		console.log(`promise.resolve called in promise2 with message ${result}`);
	})
	.catch((err) => {
		console.log(`promise.reject called in promise2 with error ${err}`)
	});
}

promise3();

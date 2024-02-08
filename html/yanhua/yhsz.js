margin:0;

padding:0;

}

span{

display: inline-block;

width: 60px;

height: 60px;

border-radius: 50%;

background: black;

color: white;

font-size: 30px;

text-align: center;

line-height: 60px;

}

i{

font-style: normal;

font-size: 20px;

}

1

:

59

:

47

//倒计时

var count = 1;

var Counter;

function countDown(){ //调用

Counter = setInterval(f,1000);

}

countDown(); //自运行

//倒计时

function f(){

var hs = Number(document.getElementById("hs").innerHTML);

var ms = Number(document.getElementById("ms").innerHTML);

var ss = Number(document.getElementById("ss").innerHTML);

if(hs==0&&ms==0&&ss==0||ss>60||ms>60||hs>24){

var hs = document.getElementById("hs").innerHTML = "00";

var ms = document.getElementById("ms").innerHTML = "00";

var ss = document.getElementById("ss").innerHTML = "00";

clearInterval(Counter);

console.log(count);

return;

}

if(ss>0){

ss--;

document.getElementById("ss").innerHTML = ss;

count++;

}

if(ss==0){

if(ms>0){

ms--;

document.getElementById("ms").innerHTML = ms;

document.getElementById("ss").innerHTML = 59;

}

}

if(ms==0){

if(hs>0){

hs--;

document.getElementById("hs").innerHTML = hs;

document.getElementById("ms").innerHTML = 59;

}

}

}
const canvasDiv = document.getElementById('canvas');
const canvasFieldset = document.getElementById('canvasFS');
const canvas = document.getElementById('draw');
const dropDown = document.getElementById('selectModel');
const ctx = canvas.getContext('2d');

canvasDiv.width = window.innerWidth - 300;
canvasDiv.height = window.innerHeight - 30;

canvas.width = window.innerWidth - 330;
canvas.height = window.innerHeight - 70;

dropDown.addEventListener("change", (event) => {
  var value = event.target.value;
  var model = document.getElementById('model');
  var element = document.getElementById(value);
  var oldElement = document.querySelector('.shown');
  
  if(element.id != "addModel"){
    model.classList.remove("hidden");
    model.classList.add("shown");
  }else{
    model.classList.remove("shown");
    model.classList.add("hidden");
  }
  element.classList.remove("hidden");
  element.classList.add("shown");
  if(oldElement != null){
    oldElement.classList.remove("shown");
    oldElement.classList.add("hidden"); 
  }
});
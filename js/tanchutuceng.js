<!DOCTYPE html>
<html>
<head>
<title>弹出图层</title>
<style>
.overlay {
position: fixed;
top: 0;
left: 0;
width: 100%;
height: 100%;
background-color: rgba(0, 0, 0, 0.5);
z-index: 9999;
display: none;
}
.popup {
position: absolute;
top: 50%;
left: 50%;
transform: translate(-50%, -50%);
background-color: #fff;
padding: 20px;
border-radius: 10px;
box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
text-align: center;
}
h2 {
margin-top: 0;
}
input[type="text"] {
padding: 10px;
margin: 10px 0;
border-radius: 5px;
border: none;
box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
width: 100%;
box-sizing: border-box;
}
button {
padding: 10px 20px;
background-color: #1c7cd6;
color: #fff;
border: none;
border-radius: 5px;
cursor: pointer;
}
button:hover {
background-color: #15549a;
}
.close {
position: absolute;
top: 10px;
right: 10px;
width: 20px;
height: 20px;
border-radius: 50%;
background-color: #ccc;
color: #fff;
font-size: 14px;
text-align: center;
line-height: 20px;
cursor: pointer;
}
.close:hover {
background-color: #999;
}
</style>
</head>
<body>
<button id="open-popup">打开弹出图层</button>
<div class="overlay" id="overlay">
<div class="popup">
<h2>弹出图层</h2>
<input type="text" placeholder="请输入内容">
<button>提交</button>
<div class="close" id="close-popup">&times;</div>
</div>
</div>
<script>
var openPopupButton = document.getElementById("open-popup");
var closePopupButton = document.getElementById("close-popup");
var overlay = document.getElementById("overlay");
openPopupButton.onclick = function() {
overlay.style.display = "block";
document.body.style.overflow = "hidden";
}
closePopupButton.onclick = function() {
overlay.style.display = "none";
document.body.style.overflow = "auto";
}
</script>
</body>
</html>
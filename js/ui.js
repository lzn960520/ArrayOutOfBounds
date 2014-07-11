function switchNAV(value) {
  if (value==0){
    $("#header #before-login").css("display","inline-block");
    $("#header #after-login").css("display","none");
  } else {
    $("#header #before-login").css("display","none");
    $("#header #after-login").css("display","inline-block");
  }
}
function switchGUI(value) {
  $(".ui").hide();
  $(".tab").removeClass("selected");
  $("#ui-"+value).show();
  if (onactive[value])
    onactive[value]();
  $("#tab-"+value).addClass("selected");
}
function deleteGUI(value) {
  if ($("#tab-"+value).hasClass("selected"))
    switchGUI("welcome");
  $("#ui-"+value).remove();
  $("#tab-"+value).remove();
}
function enableTab(value) {
  $("#tab-"+value).show();
}
function disableTab(value) {
  $("#tab-"+value).hide();
}
function addTab(id, name) {
  $("#left").append(
    "<div class='tab' id='tab-"+id+"'>"+
      name+"<span class='tab-close-btn'></span>"+
    "</div>");
}
$(function() {
  $(".popup").hide();
  $(".ui").hide();
  $(".tab").hide();
  $("body").delegate(".tab",'click',function(e){
    switchGUI(e.currentTarget.id.substring(4));
  });
  $("body").delegate(".tab-close-btn","click",function(e) {
    deleteGUI(e.currentTarget.parentElement.id.substring(4));
    e.stopPropagation();
  });
});

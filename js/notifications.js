var notimanager = function(){
	var notitop = 70;
	var playing = false;
	var queue = 0;
	function anim() {
		playing = true;
		queue--;
		var height = $(".noti:first").outerHeight()+10;
		$(".noti:first").fadeOut(300, function(){
			$(".noti:first").remove("");
			notitop -= height;
			if ($(".noti").length == 0)
				playing = false;
			else
				$(".noti").animate({
					top:"-="+height+"px"
				}, "fast", function() {
					if (queue != 0) {
						queue--;
						anim();
					} else
						playing = false;
				});
		});
	}
	function popout() {
		queue++;
		if (!playing)
			anim();
	}
	this.popup = function(message, color) {
		var noti = '<div class="noti" style="display:none;position:fixed;top:' + notitop + 'px;right:1%">'+message+'</div>';
		$("body").append(noti);
		notitop += $(".noti:last").outerHeight()+10;
		$(".noti:last").fadeIn(300);
		setTimeout(popout, 3000);
	}
	return this;
}();

function popup_noti(message) {
	notimanager.popup(message);
}

function popup_error_noti(message) {
	notimanager.popup(message, "red");
}

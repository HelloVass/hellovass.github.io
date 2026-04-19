(function($) {
	$.getUrlParam = function(name) {
		var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
		var r = window.location.search.substr(1).match(reg);
		if (r && r[2] && r[2] != 'null' && r[2] != 'undefined' && r[2] != '') {
			return unescape(r[2]);
		} else {
			return null;
		}
	}
})(jQuery);

jQuery(document).ready(function() {
	var QRBox = $('#QRBox');
	var MainBox = $('#MainBox');
	var AliPayQR = $.getUrlParam('AliPayQR');
	var WeChatQR = $.getUrlParam('WeChatQR');

	function showQR(QR) {
		if (QR) {
			MainBox.attr('src', QR);
		}
		$('#DonateText,#donateBox').addClass('blur');
		QRBox.fadeIn(300, function() {
			MainBox.addClass('showQR');
		});
	}

	$('#donateBox>li').click(function() {
		var thisID = $(this).attr('id');
		if (thisID === 'AliPay') {
			showQR(AliPayQR);
		} else if (thisID === 'WeChat') {
			showQR(WeChatQR);
		}
	});

	MainBox.click(function() {
		MainBox.removeClass('showQR').addClass('hideQR');
		setTimeout(function() {
			QRBox.fadeOut(300, function() {
				MainBox.removeClass('hideQR');
			});
			$('#DonateText,#donateBox').removeClass('blur');
		}, 600);
	});
});

var aktiv;		// to Store the GetDataTimer in ..
var clockTimer; 	//clockTimer
var _bDebug = true;
var supportsTouch = false;
var senddingItem = undefined;

$(document).ready(function() {	
	//log.warn("Page Loaded!");	
	//console.debug("Loaded!");
	/*$(".WDColorPicker").addTouch();
	$(".ui-draggable").addTouch();
	$(".draggable").addTouch();
	*/
	supportsTouch = 'ontouchstart' in window || navigator.msMaxTouchPoints;
	
	$(".ImageLoader").each(function(i){
		createUploader(this.id, {"WDImageLoader" : this.id});
	});
	$(".TreeViewLoader").each(function(i){
		createUploader(this.id, {"WDTreeView" : this.id});
	});
	
	$(".WDBaseButton").each(function(i){makeButton(this)});
	$(".WDButtonImageLoader").each(function(i){makeButton(this)});
	
	window.onresize = SetBKG;
	GetData();
	SetBKG();
	
	$(document).trigger("docReady");
});

var lastSendValue = new Array();
//var lastSendTime = new Array();

function SendDelayedData(item, value){
	//check for new Value
	clearTimeout(aktiv);
	if (lastSendValue[item] != value){
		senddingItem = item;
		if (lastSendValue[item] == undefined){
			window.setTimeout(function() { SendData(item) }, myTimeOut );
		}
		lastSendValue[item] = value;
		//log.debug("DelayedSend: " + item + "=" + value);
	}
}

function SendData(item){
	senddingItem = item;
	//console.debug("Sending item is: " + senddingItem);
	SetData(item + "=" + lastSendValue[item]);
	lastSendValue[item] = undefined;
}

function SetData(DataString) {	
	////log.debug("Sending String: " + DataString);
	clearTimeout(aktiv);
	$.ajax({
		type: "GET",
		url: "http://192.168.0.28:8080?SetVars&" + DataString,
		cache: false,
		crossDomain:true,
		dataType: "jsonp",
		success: function(data) {
			//log.error("SetVars::success. Returned: ");
			//console.debug("SetData:");
			//console.debug(data);
			parseResponse(data);
		}
	});
  // TURN OFF POLLING
	//aktiv = window.setTimeout("GetData()", 2 * myTimeOut );
}

function GetData() {
	senddingItem = undefined;
	//console.debug("Sending item is now: " + senddingItem);
	$.ajax({
		type: "GET",
		url: "http://192.168.0.28:8080?GetVars=" + myTitle,
		cache: false,
		crossDomain:true,
		dataType: "jsonp",
		success: function(data) {
			//console.debug("GetData:");
			//console.debug(data);
			if (data["Result"] == "No Vars") {
				//log.log("Error in GetData: No Vars!");
				window.clearInterval(aktiv);
				alert("No Vars, GetData - Timer stopped!");				
			} else {
				//parseResponse(data);
			}
			// TURN OFF POLLING
			//aktiv = window.setTimeout("GetData()", myTimeOut);
		},
		error: function(jqXHR, textStatus, errorThrown) {
			/*console.error("Error in GetData. Server not available?");
			console.error("	textStatus: " + textStatus);
			console.error("	errorThrown: " + errorThrown);
			console.error("	      jqXHR: " + jqXHR);*/
			// TURN OFF POLLING
			//aktiv = window.setTimeout("GetData()", 2 * myTimeOut );
		}
	});
}

function parseResponse(data){
	$.each(data, function(i, item) {
		if (i == "Result"){
			if (item != "ok"){
				////log.error("ERROR: "  + i + "::" + item);
			}
		}else{
			//log.warn("Data: "  + i + "::" + item);		
			if (item == "src"){
				//alert("Reload src: " + item);
				location.reload();
			}else{
				//console.warn("Data: "  + i + "::" + item);
				var cmd = i.split("_");
				if (i == senddingItem){
					console.debug(i + " | " + item);
				}else{
					switch(cmd[0]){ 
						case "WDFader":
							var FaderItem = "#" + i;
							var FaderHandle = FaderItem + "_Handle";
							var HandleHeight = $(FaderHandle).height();
							var scaledHeight = $(FaderItem).height() - HandleHeight;
							var HandleWidth = $(FaderHandle).width();
							var ScaledWidth = $(FaderItem).width() - HandleWidth;
							if ($(FaderItem).data("orientation") == "vertical") {
								$(FaderHandle).css("top", (scaledHeight - (scaledHeight * parseFloat(item))) + "px");
								$(FaderHandle).css("left", (($(FaderItem).width() - HandleWidth) / 2) * 0.95   + "px");
							} else {
								$(FaderHandle).css("left", (ScaledWidth * parseFloat(item))  + "px");
								$(FaderHandle).css("top", (($(FaderItem).height() - HandleHeight) / 2) * 0.95  + "px");
							}
							break;
						case "WDLabel":
							var ID = "#" + i;
							////log.warn(item);
							////log.warn(decodeURI(item));
							$(ID).html(decodeURI(item));
							break;
						case "WDTextBoxC":
							var ID = "#" + i;							
							////log.warn("Before: " + $(ID).html());							
							////log.warn("NewData: " + item);
							$(ID).val(decodeURI(item));
							////log.warn("Updated: " + decodeURI(item));
							break;
						case "WDPage":
							if (typeof item == "object"){
								PageCol1 = item["BKG_Color"].substr(0, 7);
								PageCol2 = item["BKG_Color"].substr(7, 7);
								//console.debug("SetBKG(" + PageCol1 + "," + PageCol2 + ")");
								SetBKG();
							}else{								
								location.href = item;
							}
							break;
						case "Reload":
							//alert("Reload Page");
							location.reload();
							break;
						case "ReloadImage":
							var ID = "#" + item;
							alert("Reloading Image for " + ImageID + " from URL: " + $(ImageID).attr("src"));
							$(ID).attr("src", $(ID).attr("src") + "?rnd=" + Math.random());	
							//SetData("Reloaded=" + item);
							break;		
						case "ReloadImages":
							var ID = "." + item;
							//alert("Reloading Images for class " + item);
							$(ID).each(function(i){
								$(this).attr("src", $(this).attr("src") + "?rnd=" + Math.random());	
							});
							break;						
						case "ReloadButtonImage":
							var ButtonImage = item.split("|");
							var ID = "#" + ButtonImage[0] + "_BaseImage";
							//log.debug("Reloading ButtonImage for " + ID + " from URL: " + ButtonImage[1]);
							$(ID).attr("src", ButtonImage[1]); // + "?rnd=" + Math.random());	
							//SetData("Reloaded=" + ButtonImage[0]);
							break;
						case "WebLink":
							location.href = item;
							break;
						case "WDBtnCustom":
							//log.debug("WDBtnCustom: " + item);
							var ID = "#" + i + "_text";
							$(ID).html(item);
							break;
						case "WDColorPicker":
							var ID = "#" + i;
							UpdatePicker(cmd[1], item);
							break;
						case "WDMediaPanel":
							var ID = item;
							updateMediaPanelItem(cmd[1], ID);
							break;
						case "WDBarGraph":
							updateBarGraph(i, item);
							break;
						case "WDAngularDisplay":
							SetAngularDisplay(cmd[1], item);
							break;
						case "WDClockAnalog":
							SetAnalogClockTime(cmd[1], item);
							break;
						case "WDDigitalClock":
							SetDigitalClockTime(cmd[1], item);
							break;
						case "WDDigitalDisplay":
							$("#" + i ).html(item );
							break;
						case "WDDropDown":
							if (item.Options) { 
								var select = $('#' + i);
								if(select.prop) {
								  var options = select.prop('options');
								}
								else {
								  var options = select.attr('options');
								}
								$('option', select).remove();
			
								$.each(item.Options, function(val, text) {
									options[options.length] = new Option(text, val);
								});
							}
							if (item.Index) { 
								document.getElementById(i).selectedIndex = item.Index;
			
							}
							break;
						case "WDTreeView":
							var ID = "#" + i;
							$(ID).dynatree("getTree").reload();
							break;
						case "WDPlaylist":
							var ID = "#" + i;	
							if (item['CueChanged'] != undefined){
								//log.warn(ID + " :: new Cue=> " + item['CueChanged']);
							}
							if (item['CueSelected'] != undefined){
								//log.warn(ID + " :: Cue Selected=> " + item['CueSelected']);
							}
							if (item['ListChanged'] != undefined){
								//log.warn(ID + " :: new List=> " + item['ListChanged'].length + " Cues" );
								makePlaylistTable(ID, item['ListChanged']);
							}		
							
							break;
					}
				}
			}
		}
	});
}

function makeButton(obj){
	$(obj).mouseover(function() {
		var MyID = $(this).attr("id");
		var TheOverlayImage = "#" + MyID + "_OverlayImage";
		$(TheOverlayImage).css("visibility", "visible");
	}).mouseout(function() {
		var MyID = $(this).attr("id");
		var TheOverlayImage = "#" + MyID + "_OverlayImage";
		$(TheOverlayImage).css("visibility", "hidden");
	});
	
	if ($(obj).hasClass("Toggle")){
		if (supportsTouch){
			$(obj).bind(" touchstart", toggleDown);
			$(obj).bind(" touchend", toggleUp);			
		}else{
			$(obj).bind(" mousedown", toggleDown);
			$(obj).bind(" mouseup", toggleUp);	
		}
	}else{		
		if (supportsTouch){
			$(obj).bind(" touchstart", ClickDown);
			$(obj).bind(" touchend", ClickUp);			
		}else{
			$(obj).bind(" mousedown", ClickDown);
			$(obj).bind(" mouseup", ClickUp);	
		}
		//$(obj).bind("mousedown touchstart", ClickDown);
		//$(obj).bind("mouseup touchend",ClickUp);		
	}
}

/*
*	new Click- & Tap- Functions
*/
function ClickDown(){
	var MyID = $(this).attr("id");
	var TheBaseImage = "#" + MyID + "_BaseImage";
	var TheOverlayImage = "#" + MyID + "_OverlayImage";
	$(".WDBtnCustom_OverlayImage").css("visibility", "hidden");
	$(TheBaseImage).attr("src", "WD_Imgs/" + $(this).attr('name') + "_click.png");
	SetData(MyID + "=1");
	////log.warn("MouseDown Button " + $(this).attr("name"));
}
function ClickUp(){
	var MyID = $(this).attr("id");
	var TheBaseImage = "#" + MyID + "_BaseImage";
	var TheOverlayImage = "#" + MyID + "_OverlayImage";
	$(TheBaseImage).attr("src", "WD_Imgs/" + $(this).attr('name') + "_release.png");
	if ($(this).hasClass("WDButtonImageLoader")){
		//alert($(TheOverlayImage).css("visibility"));
		if ($(TheOverlayImage).css("visibility") ==  "visible"){
			var myID = "#" +  $(this).attr("id") + "_Uploader input";
			$(myID).click();
			}
	}else{
		SetData(MyID + "=0");
		////log.warn("MouseUp Button " + MyID);
	}
	$(TheOverlayImage).css("visibility", "visible");
}

function toggleDown(){
	var MyID = $(this).attr("id");
	var TheBaseImage = "#" + MyID + "_BaseImage";
	var TheOverlayImage = "#" + MyID + "_OverlayImage";
	$(".WDBtnCustom_OverlayImage").css("visibility", "hidden");
	if ($(TheBaseImage).attr("src").search("_click.png") < 0){
		$(TheBaseImage).attr("src", "WD_Imgs/" + $(this).attr('name') + "_click.png");
		//$(TheBaseImage).addClass("ToggelDown");
		$(TheBaseImage).removeClass("ToggelDown");
		SetData(MyID + "=1");
		////log.warn("toggleDown Button " + MyID + " set Click-Image | Classes: " + $(TheBaseImage).attr('class'));
	}else{
		$(TheBaseImage).addClass("ToggelDown");
		////log.warn("toggleDown Button " + MyID + " added Toggle-Class | Classes: " + $(TheBaseImage).attr('class'));
	}
}

function toggleUp(){
	var MyID = $(this).attr("id");
	var TheBaseImage = "#" + MyID + "_BaseImage";
	var TheOverlayImage = "#" + MyID + "_OverlayImage";
	$(TheOverlayImage).css("visibility", "visible");
	if (($(TheBaseImage).attr("src").search("_click.png") > 0) && ($(TheBaseImage).hasClass("ToggelDown"))){
		$(TheBaseImage).attr("src", "WD_Imgs/" + $(this).attr('name') + "_release.png");
		SetData(MyID + "=0");
		$(TheBaseImage).removeClass("ToggelDown");
		////log.warn("toggleUP Button " + MyID + " set Release-Image | Classes: " + $(TheBaseImage).attr('class'));
	}else{
		////log.warn("toggleUP Button " + MyID + " CLEAR | Classes: " + $(TheBaseImage).attr('class'));		
	}	
	//
}

function createUploader(a, d) {
	var b = $("#" + a);
	var c = new qq.FileUploader({
		element: document.getElementById(a),
		action: "upload_file.htm",
		multiple: false,
		debug: false,
		template: '<div class="qq-uploader" id="Uploader_' + a + '"><div class="qq-upload-drop-area"><span>Drop files here to upload</span></div><div class="qq-upload-button ui-button ui-widget ui-corner-all ui-button-text-only ui-state-default">Click to upload</div><ul class="qq-upload-list"></ul></div>',
		params: d,
		onSubmit: function (id, fileName){
			//alert(this.element.id);
			var targetID = "#" + this.element.id + "_target";
			var methodID = "#" + this.element.id + "_method";
			c.setParams({
				sender: this.element.id,
				target: $("#" + this.element.id + "_target").attr("value"),
				method: $("#" + this.element.id + "_method").attr("value"),
			});
			return true;
		},
		onComplete: function(g, f, e) {
			alert("File " + f + " upload done!")
		},
		onCancel: function(f, e) {
			alert("Upload canceled")
		},
		messages: {},
		showMessage: function(e) {
			alert("showMessage: " + e)
		}
	})
}

function GoToWebLink(MyLink, name) {
	if (MyLink != "") {
		window.clearInterval(aktiv);
		$.ajax({
			type: "GET",
			url: "http://192.168.0.29:8080?SetVars&" + name + "=0",
			dataType: "jsonp",
			async: false
		});
		window.location.href = MyLink;
	}
}

/*  TreeView Items*/
function InitTreeView(myID, Mode) {
	var TreeView = "#WDTreeView_" + myID;
	$(TreeView).dynatree({
		initAjax: {
			url: "http://192.168.0.29:8080/WD_TreeData",
			data: {
				key: "root",
				id: myID
			}
		},
		onActivate: function(d) {
			//alert("onActivate: " + d)
		},
		onSelect: function(d, e) {
			//alert(d + ": " + e.data.key)
		},
		onLazyRead: function(d) {
			d.appendAjax({
				url: "http://192.168.0.29:8080/WD_TreeData",
				data: {
					key: d.data.key,
					id: myID
				}
			})
		},
		onFocus: function(node) {
        $("#WDTreeView_" + myID + "_target").attr("value" , node.data.key );
		////log.log("Set target to " + node.data.key);
    }
	});
	
	// Menustuff
	var FSMenueItems = {
		addFile: {
			name: "Add File"
		},
		addFileAndLoadPB: {
			name: "Add File + load to PB&nbsp;&nbsp;&nbsp;"
		},
		sep1: "---------",
		/*delFile: {
			name: "Delete File"
		}
		sep2: "---------",,*/
		reloadTree: {
			name: "Refresh Tree"
		},
	};
	var PBMenueItems = {
		addFilePB: {
			name: "Add Media to Project&nbsp;&nbsp;"
		},
		sep1: "---------",
		/*delFilePB: {
			name: "Delete Media from Project"
		},
		delFilePB_Disc: {
			name: "Delete Media from Disc"
		},
		sep2: "---------",*/
		reloadTreePB: {
			name: "Refresh Tree"
		},
	}

	$.contextMenu({
		selector: ".dynatree-title",
		build: function($trigger, e){
			var target = $trigger.context.offsetParent.id;
			var MenueItems;
			if ($("#" + target).hasClass("FS") ){
				MenueItems = FSMenueItems;
			}else{
				MenueItems = PBMenueItems;
			}
			return {
				callback: function(cmd, opt) {
					//var _target = $("#" + target + "_target");
					//var value = "";
					//var msg = "";
					
					//target = opt.$trigger.context.offsetParent.id;
					var value = $("#" + target + "_target").attr("value");
					var msg = "On " + target + " clicked: " + cmd + " over " +  value;
					$("#" + target + "_Uploader_target").attr("value", value );
					$("#" + target + "_Uploader_method").attr("value", cmd);
					
					switch (cmd){
						case "addFile":
							var myID = "#" +  target + "_Uploader input";
							$(myID).click();
							break;
						case "addFileAndLoadPB":
							var myID = "#" +  target + "_Uploader input";
							$(myID).click();
							break;
						case "delFile":
							var _isFolder = $("#" + target).dynatree("getTree").getNodeByKey(value).data.isFolder;
								var _type = "File";
								var question = "Do you really want to delete ";
								if (_isFolder){ 
									question = question  + "Folder:\n\n" + value + "?";
								}else{
									question = question  + "File: \n\n" + $("#" + target).dynatree("getTree").getNodeByKey(value).data.title	+ "?";
								}
								var answer = confirm(question)
								if (answer){
									SetData(_target + "=" + cmd + "|" + value);
									$("#" + target).dynatree("getTree").getNodeByKey(value).remove();
								}							
							//}
							break;
						case "reloadTree":
							//SetData(target + "=" + cmd + "|" + value);
							$("#" + target).dynatree("getTree").reload();
							break;
						case "addFilePB":
							var myID = "#" +  target + "_Uploader input";
							$(myID).click();
							break;
						case "delFilePB":
							var _isFolder = $("#" + target).dynatree("getTree").getNodeByKey(value).data.isFolder;
							if (_isFolder){
								alert("Can't delete a Folder!");
							}else{							
								var answer = confirm("Do you really want to delete this file?")
								if (answer){
									SetData(target + "=" + cmd + "|" + value);
									$("#" + target).dynatree("getTree").getNodeByKey(value).remove();
								}							
							}
							break;
						case "delFilePB_Disc":var _isFolder = $("#" + target).dynatree("getTree").getNodeByKey(value).data.isFolder;
							if (_isFolder){
								alert("Can't delete a Folder!");
							}else{							
								var answer = confirm("Do you really want to delete this file?")
								if (answer){
									SetData(target + "=" + cmd + "|" + value);
									$("#" + target).dynatree("getTree").getNodeByKey(value).remove();
								}							
							}
							break;
						case "reloadTreePB":
							SetData(target + "=" + cmd + "|" + value);
							break;
					}
				},
				items: MenueItems
			};
		}
	});
}

// Fader funktions
function makeFader(FaderItem, minValue, maxValue, orientation) {
	var FaderBase = "#" + FaderItem
	var FaderHandle = FaderBase + "_Handle"
	var _axis = "y"
	if (orientation == "horizontal") {
		_axis = "x"
	}
	$(FaderBase).data("orientation", orientation);
	$(FaderBase).data("minValue", minValue);
	$(FaderBase).data("maxValue", maxValue);
	$(FaderBase).data("Range", maxValue - minValue);

	$(FaderBase).mousedown(function(e) {MouseSetHandle(e, FaderBase);});
	//$(FaderBase).bind(" mousedown touchdown", function(e) {MouseSetHandle(e, FaderBase)} );
	$(FaderHandle).draggable({
		axis: _axis,
		containment: FaderBase,
		drag: function() {
			SendFaderValue(FaderBase)
		},
		stop: function() {
			SendFaderValue(FaderBase)
		},
	});
}


function SendFaderValue(FaderItem) {
	var FaderHandle = FaderItem + "_Handle";
	if ($(FaderItem).data("orientation") == "vertical") {
		var Value = $(FaderItem + "_Handle").position().top;
		var HandleHeight = $(FaderHandle).height();
		var scaledHeight = $(FaderItem).height() - HandleHeight;
		var scaledValue = 1 -  Value/scaledHeight;
		FaderItem = FaderItem.replace("#", "")
		
	} else {
		var Value = $(FaderItem + "_Handle").position().left;
		var HandleWidth = $(FaderHandle).width();
		var scaledWidth = $(FaderItem).width() - HandleWidth;
		var scaledValue = Value/scaledWidth;
		FaderItem = FaderItem.replace("#", "")
	}
	SendDelayedData(FaderItem,scaledValue); // Round(scaledValue,4));
	//SetData(FaderItem + "=" + Round(scaledValue,4));	
	////log.warn("Send: " + FaderItem + "=" + Round(scaledValue,4));
}

function MouseSetHandle(e, FaderItem) {
	posx = 0;
	posy = 0;
	if (!e) {
		var e = window.event;
	}
	if (e.pageX || e.pageY) {
		posx = e.pageX;
		posy = e.pageY;
	} else if (e.clientX || e.clientY) {
		posx = e.clientX;
		posy = e.clientY;
	}
	posx = posx - $(FaderItem).position().left;
	posy = posy - $(FaderItem).position().top;
	var Handle = FaderItem + "_Handle";
	if ($(FaderItem).data("orientation") == "vertical") {
		var HandleHeight = $(Handle).height();
		var MaxHeight = $(FaderItem).height() - HandleHeight;
		posy = posy - (HandleHeight / 2);
		if (posy < 0) {
			posy = 0
		}
		if (posy > MaxHeight) {
			posy = MaxHeight
		}
		$(Handle).css("top", posy + "px");
		SendFaderValue(FaderItem);
	} else {
		var HandleWidth = $(Handle).width();
		var MaxWidth = $(FaderItem).width() - HandleWidth;
		posx = posx - (HandleWidth / 2);
		if (posx < 0) {
			posx = 0
		}
		if (posx > MaxWidth) {
			posx = MaxWidth
		}
		$(Handle).css("left", posx + "px");
		SendFaderValue(FaderItem);
	}
}

// BackGround Functions
function SetBKG() {
	if (WDBGImg != ""){
		var BkgImage = new Image();
			BkgImage.src = WDBGImg;
			BkgImage.onload = function() {
				drawBKG(PageCol1, PageCol2, PageMinWidth, PageHeight, BkgImage);		
			}
	}else{
		PageWidth = window.innerWidth;
		if (PageWidth < PageMinWidth) {
			//alert("Window to small: is" + PageWidth + "  min:" + PageMinWidth );
			PageWidth = PageMinWidth;
		}
		$("#WDBG").attr("width", PageWidth);
		drawBKG(PageCol1, PageCol2, PageWidth, PageHeight, WDBGImg);
	}
}
function drawBKG(PageCol1, PageCol2, PageWidth, PageHeight, WDBGImg) {

	// get the canvas element using the DOM
	var canvas = document.getElementById('WDBG');

	// Make sure we don't execute when canvas isn't supported
	// NOTE:: EDITED THIS. WAS if(canvas.getContext)
	if (canvas) {
		var ctx = canvas.getContext('2d');
		if (WDBGImg == "") {
			var grad = ctx.createLinearGradient(0, 0, 0, PageHeight);
			grad.addColorStop(0, PageCol1);
			grad.addColorStop(1, PageCol2);

			ctx.fillStyle = grad;
			ctx.fillRect(0, 0, PageWidth, PageHeight);
		}else{
			var ImgWidth = WDBGImg.width;
			var ImgHeight = WDBGImg.height;
			if(WDBGImg.width >= PageWidth){
				ImgWidth = PageWidth;
			}
			if(WDBGImg.height >= PageHeight){
				ImgHeight = PageHeight;
			}
			ctx.drawImage(WDBGImg, 0,0, WDBGImg.width, WDBGImg.height, 0, 0, ImgWidth, ImgHeight);
		}
		
	} 
}

// ColorPicker Stuff
var picker = new Array(); // ColorPicker Data
var MouseDown = 0; 			// IsMouseDown for ColorPicker
var RadiusOffset = 0.98;
function makeColorPicker(id) {
	picker[id] = new PickerObjekt();
	picker[id].image = new Image();
	picker[id].Color = new HSVColor();

	picker[id].image.src = 'WD_Imgs/WDColorPicker_' + id + '_round.png?rnd=' + new Date().getTime();
	picker[id].Color.setFromRGBString("rgb(128, 128, 128)");
	var targetFunction = "paintColorPicker(" + id + ")";
	// to give the Browser the Time to laod the Image from the Server
	setTimeout(targetFunction, 50);

	$("#WDColorPicker_" + id).bind('mousedown', function(e) {
		if (e.which == 1) {
			MouseDown = 1
		}
		ClickColorPicker(e, id);
	}).bind('mouseup', function(e) {
		if (MouseDown == 1) {
			ClickColorPicker(e, id);
		}
		MouseDown = 0;
	}).bind('mousemove', function(e) {
		if (MouseDown == 1) {
			ClickColorPicker(e, id);
		}
	});
}
function UpdatePicker(id, RGBHex) {
	picker[id].Color.setFromRGBHex(RGBHex);
	paintColorPicker(id);
}

// AnalogClockStuff
function SetAnalogClockTime(id, time){
	var now = new Date();
	now.setTime(parseInt(time));
	////log.warn(now.getHours());
	////log.warn(now.getTimezoneOffset());
	var hour = now.getUTCHours() + now.getUTCMinutes() / 60;
	if (hour >= 12) {hour -= 12;}
	$("#WDClockAnalog_" + id + "_HourHand").rotate( hour * 30);  
	$("#WDClockAnalog_" + id + "_MinuteHand").rotate(now.getUTCMinutes() * 6);
	$("#WDClockAnalog_" + id + "_SecondHand").rotate(now.getUTCSeconds() * 6);	
}

// DigitalClockStuff
function SetDigitalClockTime(id, time){
	/*var now = new Date();
	now.setTime(parseInt(time));
	//log.warn("Set " + "#WDDigitalClock_" + id + " to: " + now);
	////log.warn(now.getTimezoneOffset());
	var hour = now.getUTCHours() + now.getUTCMinutes() / 60;
	$("#WDDigitalClock_" + id ).html( padLeft(now.getHours(), 2) + ":" + padLeft(now.getMinutes(),2) + ":" +  padLeft(now.getSeconds(), 2) );	*/
	$("#WDDigitalClock_" + id ).html(time);
}

// AngularDisplayStuff
function SetAngularDisplay(id, newValue){
	var item = "#WDAngularDisplay_" + id + "_SecondHand";
	$(item).rotate(parseFloat(newValue));	
}

// ColorPickerStuff
function HSVColor() {
	// set H as [0 - 360]
	this.H = 0;
	// set S as [0 - 100]
	this.S = 100;
	// set L as [0 - 100]
	this.V = 100;
	// set B as [0 - 100]
	// to store the Gradient-Value
	this.B = 100;
	this.getHSL_String = function() {
		var RGBArr = hsv2rgb(this.H / 360, this.S / 100, this.V / 100);
		var ColorHSLArr = rgb2hsl(RGBArr[0], RGBArr[1], RGBArr[2]);
		return "hsl(" + Math.round(ColorHSLArr[0] * 360) + ", " + Math.round(ColorHSLArr[1] * 100) + "%, " + Math.round(ColorHSLArr[2] * 100) + "%)";
	};
	this.getHSV_String = function() {
		return "hsv(" + Math.round(this.H) + ", " + Math.round(this.S) + "%, " + Math.round(this.V) + "%)";
	};
	this.getRGB_String = function() {
		var RGBarr = hsv2rgb(this.H / 360, this.S / 100, this.V / 100);
		return "rgb(" + Math.round(RGBarr[0]) + ", " + Math.round(RGBarr[1]) + ", " + Math.round(RGBarr[2]) + ")";
	};
	this.getRGBB_String = function() {
		var RGBarr = hsv2rgb(this.H / 360, this.S / 100, this.B / 100);
		return "rgb(" + Math.round(RGBarr[0]) + ", " + Math.round(RGBarr[1]) + ", " + Math.round(RGBarr[2]) + ")";
	};
	this.getRGBB_HexString = function() {
		var RGBarr = hsv2rgb(this.H / 360, this.S / 100, this.B / 100);
		return rgb2hex(Math.round(RGBarr[0]), Math.round(RGBarr[1]), Math.round(RGBarr[2]));
	};
	this.getServerString = function() {
		var RGBarr = hsv2rgb(this.H / 360, this.S / 100, this.V / 100);
		var rgb = Math.round(RGBarr[2]) | (Math.round(RGBarr[1]) << 8) | (Math.round(RGBarr[0]) << 16);
		return rgb.toString(16);
	};
	this.setFromRGBString = function(RGBString) {
		var RGBArr = RGBString.match(/\d+/g);
		var ColorHSVArr = rgb2hsv(RGBArr[0], RGBArr[1], RGBArr[2]);
		this.H = ColorHSVArr[0] * 360;
		this.S = ColorHSVArr[1] * 100;
		this.V = ColorHSVArr[2] * 100;
		//this.B = this.V;
	}
	this.setFromRGBHex = function(RGBHex) {
		var RGBArr = hex2rgb(RGBHex);
		var ColorHSVArr = rgb2hsv(RGBArr[0], RGBArr[1], RGBArr[2]);
		this.H = ColorHSVArr[0] * 360;
		this.S = ColorHSVArr[1] * 100;
		this.V = ColorHSVArr[2] * 100;
/*this.B = this.V;
		//log.info( "Color set to: " + this.getHSV_String() );
		//log.info( "Color set to: " + this.getRGB_String() );
		//log.info( "Color set to: " + this.getRGBB_String() );
		*/
	}
}
var PickerObjekt = function() {
	var image;
	var Color;
}
function ClickColorPicker(e, id) {
	posx = 0;
	posy = 0;
	if (!e) {
		alert("no e!");
		var e = window.event;
	}
	if (e.pageX || e.pageY) {
		posx = e.pageX;
		posy = e.pageY;
	} else if (e.clientX || e.clientY) {
		posx = e.clientX;
		posy = e.clientY;
	}
	posx = posx - $('#WDColorPicker_' + id).position().left;
	posy = posy - $('#WDColorPicker_' + id).position().top;
	if ((posx <= picker[id].image.width) & (posy <= picker[id].image.width)) {
		picker[id].Color = getColor(posx, posy, picker[id].image.width / 2, picker[id].Color.V);
	}
	var left = 0.02 * picker[id].image.width + picker[id].image.width;
	var top = 0.2 * picker[id].image.width;
	var width = 0.2 * picker[id].image.width + 30;
	var height = 0.83 * picker[id].image.width + 2;
	////log.log(left +"," + top +"," + width +"," + height);
	if ((posx > left) & (posx < left + width) & (posy > top) & (posy < top + height)) {
		var newValue = 101 - 100 * (posy - top) / (height - 2);
		if (newValue > 100) {
			newValue = 100;
		}
		if (newValue < 0) {
			newValue = 0;
		}
		picker[id].Color.V = Math.round(newValue);
	}
	SendDelayedData('WDColorPicker_' + id , picker[id].Color.getServerString());
	////log.debug("Sending: " + 'WDColorPicker_' + id + "=" + picker[id].Color.getServerString());
	paintColorPicker(id);

};
function paintColorPicker(id) {
	//$("#Label_" + id).html(picker[id].Color.getRGB_String() + "\n<br>" + picker[id].Color.getHSV_String());
	var canvas = document.getElementById('WDColorPicker_' + id);
	var BorderColor = "#808080";
	if (canvas.getContext) {

		// basic geometric values for the Gradient
		var radius = picker[id].image.width / 2;
		var left = Math.round(0.02 * picker[id].image.width + picker[id].image.width);
		var top = Math.round(0.2 * picker[id].image.width);
		var width = Math.round(0.2 * picker[id].image.width);
		var height = Math.round(0.83 * picker[id].image.width);

		var ctx = canvas.getContext('2d');
		ctx.clearRect(0, 0, 500, 500);

		//ColorCircle
		ctx.drawImage(picker[id].image, 0, 0);

		//Triangle
		ctx.strokeStyle = "#fff";
		ctx.lineWidth = 0.7;
		ctx.beginPath();
		var tipPoint = top + height - (height * picker[id].Color.V / 100);
		ctx.moveTo(left + width + 2, tipPoint);
		ctx.lineTo(left + width + 7, tipPoint + 5);
		ctx.lineTo(left + width + 7, tipPoint - 5);
		ctx.lineTo(left + width + 2, tipPoint);
		ctx.stroke();
		ctx.closePath();

		// Selected Color Circle
		ctx.strokeStyle = "#000";
		ctx.lineWidth = 1;
		ctx.beginPath();
		var DEGREE_TO_RADIANT = 2 * Math.PI / 360;
		var AngleOffset = 1.58;
		var distance = ((picker[id].Color.V - 100) / 100);
		distance = picker[id].Color.S / 100;
		var CenterX = radius - Math.sin(picker[id].Color.H * DEGREE_TO_RADIANT - AngleOffset) * radius * distance * RadiusOffset;
		var CenterY = radius - Math.cos(picker[id].Color.H * DEGREE_TO_RADIANT - AngleOffset) * radius * distance * RadiusOffset;
		ctx.arc(CenterX, CenterY, 3, 0, Math.PI * 2, true);
		ctx.stroke();
		ctx.closePath();

		//Gradient		
		ctx.fillStyle = BorderColor;
		ctx.fillRect(
		left, top, width + 1, height + 1);
		var grad = ctx.createLinearGradient(0, 0, 0, 0.83 * picker[id].image.width * 1.2);
		grad.addColorStop(0.0, picker[id].Color.getRGBB_String());
		grad.addColorStop(0.2, picker[id].Color.getRGBB_String());
		grad.addColorStop(1, "#000000");
		ctx.fillStyle = grad;
		ctx.fillRect(
		0.02 * picker[id].image.width + picker[id].image.width, 0.2 * picker[id].image.width, 0.2 * picker[id].image.width, 0.83 * picker[id].image.width);

		//SelectedColor	
		ctx.fillStyle = BorderColor;
		ctx.fillRect(
		0.02 * picker[id].image.width + picker[id].image.width, 0, 0.2 * picker[id].image.width + 1, 0.75 * 0.2 * picker[id].image.width + 2);

		ctx.fillStyle = picker[id].Color.getRGB_String();
		ctx.fillRect(
		0.02 * picker[id].image.width + picker[id].image.width, 1, 0.2 * picker[id].image.width, 0.75 * 0.2 * picker[id].image.width);

	} else {
		var ErrorElement = "#WD_ColorPickerError_" + id ;
		if ($(ErrorElement).length <= 0){
			var ErrorText = "Your Browser does not support the HTML5 - Element CANVAS.<br>Please upgrade you Browser.";
			var Element2Add = '<div id="WD_ColorPickerError_' + id + '">'; //<div id=ErrorContent_1>'
			Element2Add += ErrorText + '</div>'; //</div>
			$(Element2Add).insertAfter('#WDColorPicker_' + id);
			$('#WD_ColorPickerError_' + id).css("position", "absolute");
			$('#WD_ColorPickerError_' + id).css("left", $('#WDColorPicker_' + id).css("left"));
			$('#WD_ColorPickerError_' + id).css("top", $('#WDColorPicker_' + id).css("top"));
			$('#WD_ColorPickerError_' + id).css("width", $('#WDColorPicker_' + id).css("width"));
			$('#WD_ColorPickerError_' + id).css("height", $('#WDColorPicker_' + id).css("height"));
			//$('#WD_ColorPickerError_' + id).width($('#WDColorPicker_' + id).width());
			//$('#WD_ColorPickerError_' + id).height($('#WDColorPicker_' + id).height());
			$('#WD_ColorPickerError_' + id).css("background-color", "red");
			//$('#WD_ColorPickerError_' + id).css("color", "#008CF8");
			$('#WD_ColorPickerError_' + id).css("color", "#000");
			$('#WD_ColorPickerError_' + id).css("text-align", "center");
			//$('#WD_ColorPickerError_' + id).css("display", "inline");
			//$('#WD_ColorPickerError_' + id).css("vertical-align", "middle");
			//$('#WD_ColorPickerError_' + id).css("line-height", "100%");
			$('#WD_ColorPickerError_' + id).css("font", "bold 12px Georgia, serif");
			$('#WD_ColorPickerError_' + id).css("line-height", "40px");
		}
	}
}
function getColor(posx, posy, radius, currValue) {
	posx = posx - radius * RadiusOffset;
	posy = posy - radius * RadiusOffset;
	var degrees = 0;
	var DEGREES_PER_RADIAN = 180.0 / Math.PI;
	if (posx == 0) {
		// The point is on the y-axis. Determine whether 
		// it's above or below the x-axis, and return the 
		// corresponding angle. Note that the orientation of the
		// y-coordinate is backwards. That is, A positive Y value 
		// indicates a point BELOW the x-axis.
		if (posy > 0) {
			degrees = 270;
		} else {
			degrees = 90;
		}
	} else {
		// This value needs to be multiplied
		// by -1 because the y-coordinate
		// is opposite from the normal direction here.
		// That is, a y-coordinate that's "higher" on 
		// the form has a lower y-value, in this coordinate
		// system. So everything's off by a factor of -1 when
		// performing the ratio calculations.
		//  38 = atan(15/-19)
		degrees = -Math.atan(posy / posx) * DEGREES_PER_RADIAN;
		// If the x-coordinate of the selected point
		// is to the left of the center of the circle, you 
		// need to add 180 degrees to the angle. ArcTan only
		// gives you a value on the right-hand side of the circle.
		if (posx < 0) {
			degrees += 180;
		}

		// Ensure that the return value is 
		// between 0 and 360.
		degrees = (degrees + 360) % 360;
	}
	// Calculate distance from the center to the new point 
	// as a fraction of the radius. Use your old friend, 
	// the Pythagorean theorem, to calculate this value.
	var distance = Math.sqrt(posx * posx + posy * posy) / radius;
	if (distance > 1) {
		distance = 1;
	}
	var V = Math.round(distance * 100);
	if (V > 100) {
		V = 100;
	}
	var newHSV = new HSVColor();
	newHSV.H = Math.round(degrees);
	newHSV.S = V;
	newHSV.V = currValue;
	return newHSV;
}

// MediaPanel
var HighLightColor = "#4169E1";
function selectMediaPanelItem(item, PanelID) {
	updateMediaPanelItem(PanelID, item);
	SetData("WDMediaPanel_" + PanelID + "=" + item);
}
function updateMediaPanelItem(id, item) {
	$(".CITP_Img.MP" + id).removeClass("WDMediaPanel_selected");
	var ImageSelector = '[class*="MP' + id + '"][id="' + item + '"]';
	$(ImageSelector).addClass("WDMediaPanel_selected");
}

// BarGraph
function updateBarGraph(ID, value) {
	var objID = "#" + ID + "_Value";
	var parentObj = "#" + ID;
	var parTop = parseInt($(parentObj).css("top"));
	var parLeft = parseInt($(parentObj).css("left"));
	var parWidth = parseInt($(parentObj).css("width"));
	var parHeight = parseInt($(parentObj).css("height"));
	var parVal = parseFloat(value);
	
	
	if ($(objID).hasClass("Angel_Right")){
		var newLeft = parLeft + (parWidth * parVal);
		$(objID).css("left", newLeft);
		$(objID).css("width", parWidth - (parWidth * parVal));
		}
	if ($(objID).hasClass("Angel_Left")){
		$(objID).css("width",  (parWidth - (parWidth * parVal)));
		}
	
	if ($(objID).hasClass("Angel_Up")){
		$(objID).css("height", parHeight - (parHeight * parVal));
		}
	if ($(objID).hasClass("Angel_Down")){
		var newTop = parTop + parHeight - (parHeight * parVal);
		$(objID).css("top", newTop);
		$(objID).css("height", (parHeight * parVal));
		}
	
	//$(objID).animate({ height: value}, 0.8 * myTimeOut, "linear");
}

// Playlist
function makePlaylistTable(ID, Data){
	var htm = '<thead><tr> <th width="20px">ID</th> <th width="50px">Time</th> <th width="80px">Video/Image</th> <th width="40px">Audio</th> <th width="40px">Script</th> <th width="40px">Jump</th> <th width="40px">Count</th> <th width="40px">Fade</th> <th width="60px">Pre Roll</th>  </tr></thead>';
    $(ID).html(htm);
	htm +='<tbody>';
	for(var i=0;i<=Data.length-1;i++){
		////log.info(ID + ":Insert Cue: " + Data[i][2]);
		htm += '<tr id="' + ID + '_Cue_' + i + '" >';
		htm += '<td class="edit" id="' + ID + '_Data0_' + i + '">'+Data[i][0]+'</td>';
		htm += '<td class="edit" id="' + ID + '_Data1_' + i + '">'+Data[i][1]+'</td>';
		htm += '<td class="edit" id="' + ID + '_Data2_' + i + '">'+Data[i][2]+'</td>';
		htm += '<td class="edit" id="' + ID + '_Data3_' + i + '">'+Data[i][3]+'</td>';
		htm += '<td class="edit" id="' + ID + '_Data4_' + i + '">'+Data[i][4]+'</td>';
		htm += '<td class="edit" id="' + ID + '_Data5_' + i + '">'+Data[i][5]+'</td>';
		htm += '<td class="edit" id="' + ID + '_Data6_' + i + '">'+Data[i][6]+'</td>';
		htm += '<td class="edit" id="' + ID + '_Data7_' + i + '">'+Data[i][7]+'</td>';
		htm += '<td class="edit" id="' + ID + '_Data8_' + i + '">'+Data[i][8]+'</td>';
		htm += '</tr>';
	}	
	if (Data.length < 10){
		//htm += '</tbody></table><table id="dummytable"><tbody>';
		for(var i=Data.length;i<=10;i++){
			htm += '<tr>';
			htm += '<td></td>';
			htm += '<td></td>';
			htm += '<td></td>';
			htm += '<td></td>';
			htm += '<td></td>';
			htm += '<td></td>';
			htm += '<td></td>';
			htm += '<td></td>';
			htm += '<td></td>';
			htm += '</tr>';
		}
	}
	htm +='</tbody>';
	$(ID).html(htm);
	$(".edit").editable('/save.php', {
		//indicator : 'Saving...',
		tooltip   : "Rightclick to edit...",
		event     : "contextmenu",
		placeholder: ""
	});
	makeDragDrop(ID);
}

function makePlaylist(ID, Data){
	$(ID).dataTable( {
		"bPaginate": false,
		"bLengthChange": false,
		"bFilter": false,
		"bSort": false,
		"bInfo": false,
		"bAutoWidth": false,
		"aaData": Data,
		"aoColumns": [
			{ "sTitle": "ID" },
			{ "sTitle": "Time" , "sClass": "center" },
			{ "sTitle": "Video/Image" },
			{ "sTitle": "Audio", "sClass": "center" },
			{ "sTitle": "Script", "sClass": "center" },
			{ "sTitle": "Jump", "sClass": "center" },
			{ "sTitle": "Count", "sClass": "center" },
			{ "sTitle": "Fade", "sClass": "center" },
			{ "sTitle": "PreRoll", "sClass": "center" }
		]
	    } );
}

/**
 *	DragDrop for Table
 */
var start;
var end;
function makeDragDrop(ID){
	$(ID + " tbody").sortable({
		cursor: "move",
		start:function(event, ui){
			// 0 based array, add one
			start = ui.item.prevAll().length + 1;
		},
	
		update: function(event, ui) {
			// 0 based array, add one
			end = ui.item.prevAll().length + 1;
			//alert('Start: ' + start + ' End: ' + end);
			//var id = ui.item.context.children[0].innerHTML;
			var id = ui.item.context.id;
			alert(id);
			/*
			    $.getJSON('dao.cfc', {
				method:'methodName',
				returnFormat:'JSON',
				name:value
					},
		
			    // handle the response
			    function(data){
				if(data.intSuccess == 1){
				// success
				    } else {
				// error
				    }
				});*/
		}
		// end of drag
	});
}

// ColorConverters #######################################
function rgb2hex(r, g, b) {
	var rgb = b | (g << 8) | (r << 16);
	return '#' + rgb.toString(16);
}
function hex2rgb(h) {
	var R = parseInt((hex_cutter(h)).substring(0, 2), 16);
	var G = parseInt((hex_cutter(h)).substring(2, 4), 16);
	var B = parseInt((hex_cutter(h)).substring(4, 6), 16);
	return [R, G, B];
}
function hex_cutter(h) {
	return (h.charAt(0) == "#") ? h.substring(1, 7) : h;
}
/**
 * Converts an RGB color value to HSL. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes r, g, and b are contained in the set [0, 255] and
 * returns h, s, and l in the set [0, 1].
 *
 * @param   Number  r       The red color value
 * @param   Number  g       The green color value
 * @param   Number  b       The blue color value
 * @return  Array           The HSL representation
 */
function rgb2hsl(r, g, b) {
	r /= 255, g /= 255, b /= 255;
	var max = Math.max(r, g, b),
		min = Math.min(r, g, b);
	var h, s, l = (max + min) / 2;

	if (max == min) {
		h = s = 0; // achromatic
	} else {
		var d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		switch (max) {
		case r:
			h = (g - b) / d + (g < b ? 6 : 0);
			break;
		case g:
			h = (b - r) / d + 2;
			break;
		case b:
			h = (r - g) / d + 4;
			break;
		}
		h /= 6;
	}

	return [h, s, l];
}
/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   Number  h       The hue
 * @param   Number  s       The saturation
 * @param   Number  l       The lightness
 * @return  Array           The RGB representation
 */
function hsl2rgb(h, s, l) {
	var r, g, b;

	if (s == 0) {
		r = g = b = l; // achromatic
	} else {
		function hue2rgb(p, q, t) {
			if (t < 0) t += 1;
			if (t > 1) t -= 1;
			if (t < 1 / 6) return p + (q - p) * 6 * t;
			if (t < 1 / 2) return q;
			if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
			return p;
		}

		var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		var p = 2 * l - q;
		r = hue2rgb(p, q, h + 1 / 3);
		g = hue2rgb(p, q, h);
		b = hue2rgb(p, q, h - 1 / 3);
	}

	return [r * 255, g * 255, b * 255];
}
/**
 * Converts an RGB color value to HSV. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSV_color_space.
 * Assumes r, g, and b are contained in the set [0, 255] and
 * returns h, s, and v in the set [0, 1].
 *
 * @param   Number  r       The red color value
 * @param   Number  g       The green color value
 * @param   Number  b       The blue color value
 * @return  Array           The HSV representation
 */
function rgb2hsv(r, g, b) {
	r = r / 255, g = g / 255, b = b / 255;
	var max = Math.max(r, g, b),
		min = Math.min(r, g, b);
	var h, s, v = max;

	var d = max - min;
	s = max == 0 ? 0 : d / max;

	if (max == min) {
		h = 0; // achromatic
	} else {
		switch (max) {
		case r:
			h = (g - b) / d + (g < b ? 6 : 0);
			break;
		case g:
			h = (b - r) / d + 2;
			break;
		case b:
			h = (r - g) / d + 4;
			break;
		}
		h /= 6;
	}

	return [h, s, v];
}
/**
 * Converts an HSV color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSV_color_space.
 * Assumes h, s, and v are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   Number  h       The hue
 * @param   Number  s       The saturation
 * @param   Number  v       The value
 * @return  Array           The RGB representation
 */
function hsv2rgb(h, s, v) {
	var r, g, b;

	var i = Math.floor(h * 6);
	var f = h * 6 - i;
	var p = v * (1 - s);
	var q = v * (1 - f * s);
	var t = v * (1 - (1 - f) * s);

	switch (i % 6) {
	case 0:
		r = v, g = t, b = p;
		break;
	case 1:
		r = q, g = v, b = p;
		break;
	case 2:
		r = p, g = v, b = t;
		break;
	case 3:
		r = p, g = q, b = v;
		break;
	case 4:
		r = t, g = p, b = v;
		break;
	case 5:
		r = v, g = p, b = q;
		break;
	}

	return [r * 255, g * 255, b * 255];
}
function padLeft(number, length) {
   
    var str = '' + number;
    while (str.length < length) {
        str = '0' + str;
    }
   
    return str;

}

// Helpers
function Round(value, digits){
	var RoundMax = value * digits * 10;
	RoundMax = Math.floor(RoundMax);
	return RoundMax / (digits * 10);
}
function htmlEncode(value){
    if (value) {
        return jQuery('<div />').text(value).html();
    } else {
        return '';
    }
}
function htmlDecode(value) {
    if (value) {
        return $('<div />').html(value).text();
    } else {
        return '';
    }
}
function PrePareData(strg){
	return escape(strg.replace(/\+/g, "%2B"));
}


function FlickrFolio(){
	'use strict';
	var that = this;

	/* you can customize this parameters */
	that.pageTitle = "Francesco Stasi" // that's me! Put your name here :)
	that.api_key = "d683b88c8be51f4a8f3aba71a6c009d5"; // your api_key (provided by flickr)
	that.user_id = "132132956%40N03"; // your user id
	that.tags = "portfolio"; // the tag you used to mark your picture on flickr. Images with this tag will be showed in the gallery

	that.flickrApiUrl = "https://api.flickr.com/services/rest/?method=flickr.photos.search"+
		"&api_key="+that.api_key+
		"&user_id="+that.user_id+
		"&tags="+that.tags+
		"&privacy_filter=1&in_gallery=1&extras=description,tags&per_page=500&format=json&nojsoncallback=1";

	/* initialization function */
	that.init = function(){
		that.loadJSON();
	}
}

/* Loads the JSON object representing all the pictures that have to be showed in the gallery
Once the load is complete, parses the object and generate the gallery and the overbox (big images)	

 */
FlickrFolio.prototype.loadJSON = function() {
	'use strict';
	var that = this;

	console.log("Loading", that.flickrApiUrl);

	$.getJSON(that.flickrApiUrl, function(data){


		if(data.stat === "fail"){

			console.log("Error loading url", url);
			console.log(data);
			return;
		}

		var photo;
		var photoThumb = "";
		var photoFull = "";
		that.thumbToLoad = 0;
				
		for(var i = 0, len = data.photos.photo.length; i<len; i++){
			photo = data.photos.photo[i];

			photoThumb += that.generatePhotoThumb(photo);
			photoFull += that.generatePhotoFull(photo);
			
			that.thumbToLoad++;
		}

		//once finished, put the string in the html
		$(".container .gallery").append(photoThumb);
		$("#overbox").append(photoFull);


		that.imgLoadComplete();
		
		that.thumbBindings();

		that.generateOverboxBindings();
		
	});
};

/* generates the bindings used to pre-load the images in the overbox
When every thumbnail is loaded, the overbox is shown (in a non visible portion of the screen)
This causes the pre-load of the big images, therefore the user will have the big images alredy loaded when he'll try to show them
*/
FlickrFolio.prototype.imgLoadComplete = function(){
	'use strict';
	var that = this;

	$(".thumb img").one("load", function(){
	
		that.thumbToLoad -- ;
		if( that.thumbToLoad <= 0) {
			//start the preloading of big images
			console.log("Preload big images");
			$("#overbox").removeClass("hidden");
		}

	}).each(function() {
		if(this.complete) $(this).load();
	});

};

/* generates the gallery thumbnails bindings */
FlickrFolio.prototype.thumbBindings = function(){
	'use strict';
	var that = this;

	$(".thumb a").mouseenter(function() {
		$(this).find(".caption").removeClass("hidden");
	}).mouseleave(function() {
		$(this).find(".caption").addClass("hidden");
	}).click(function(){
		that.openOverBox($(this).attr("href"));
		return false;
	});
};

/* generates the overbox bindings (keys and clicks) */
FlickrFolio.prototype.generateOverboxBindings = function(){
	'use strict';
	var that = this;

	$(document).keyup(function(e) {

		switch(e.which) {
			
			case 27: // ESC, close overbox
				that.closeOverbox();
			break;

			case 37: // left, previous fullscreen picture
				that.prevOverbox();
			break;

			case 38: // up, close the overbox
				that.closeOverbox();
			break;

			case 39: // right, next full screen picture
				that.nextOverbox();
			break;

			case 40: // down, close overbox
				that.closeOverbox();
			break;

			default: return; // exit this handler for other keys
		}
		e.preventDefault(); // prevent the default action (scroll / move caret)
		e.stopPropagation();
	});

	// create binds for the icons in the top bar of the overbox panel
	$("#overbox").on("click",".closeoverbox",function(){that.closeOverbox(); return false;})
				.on("click",".prev",function(){that.prevOverbox(); return false;})
				.on("click",".next",function(){that.nextOverbox(); return false;});
	

	//while the overbox is shown, suppress any kind of scroll
	$(window).on('wheel mousewheel keydown',function(e){

		if( $("#overbox").is(":visible") && $("#overbox").hasClass("shown") ){

			e.preventDefault();
			e.stopPropagation();

			return false;
		}

	});


};

/* Given a flicker photo obj, gets the image path 
	@photoObj: the JSON obj rapresenting the flickr image
	@size: request the given size using flickr apis
	@full: if set, calculates the right size for the screen, and then retrieve the right picture from flickr

List of the flickr picture sizes:
	s,  // small square, 75 x 75
	q,  // large square, 150x150
	t,  // miniature, 100 on longest side
	m,  // small, 240 on longest side
	n,  // small, 320 on longest side
	-,  // medium, 500 on longest side
	z,  // medium, 640 on longest side
	c,  // medium, 800 on longest side
	b,  // big, 1024 on longest side
	h,  // big, 1600 on longest side
	k,  // big, 2048 on longest side
	
*/
FlickrFolio.prototype.getPhotoImage = function(photoObj, size, full) {
	'use strict';
	var that = this;

	var bodyW = $("body").width();

	if(full){

		bodyW *= 0.8;
		if( bodyW > 1600 ) { size = "k"}
		else if( bodyW > 1024 ) { size = "h"}
		else { size = "b"}
	}
	
	if(size){
		size = "_"+size;
	}else{

		if( bodyW > 992 ) { size = ""; }
		else if( bodyW > 800 ) { size = "_b"; }
		else if( bodyW > 640 ) { size = "_c"; }
		else if( bodyW > 500 ) { size = "_z"; }
		else if( bodyW > 320 ) { size = ""; }
		else { size = "_n"; }

	}

	return "https://farm"+photoObj.farm+".staticflickr.com/"+photoObj.server+"/"+photoObj.id+"_"+photoObj.secret+size+".jpg";
};

/* generate the photo thumb, creating html for the given pic */
FlickrFolio.prototype.generatePhotoThumb = function(photoObj) {
	'use strict';
	var that = this;

	var col_layout = "thumb col-md-4 col-lg-3";

	var str = '<img src="'+that.getPhotoImage(photoObj)+'" alt="'+photoObj.title+'" class="img-fluid" />'+
			'<div class="caption hidden"><span class="glyphicon glyphicon-fullscreen hidden-xs hidden-sm" aria-hidden="true"></span>'+
			'<h3>'+photoObj.title+'</h3><p>'+photoObj.description._content+'</p></div>';

	return '<div class="'+col_layout+'"><a href="'+photoObj.id+'">'+str+'</a></div>';
}

/* generate the photo full image, creating html for the given pic */
FlickrFolio.prototype.generatePhotoFull = function(photoObj) {
	'use strict';
	var that = this;

	var str = '<img src="'+that.getPhotoImage(photoObj,null, true)+'" alt="'+photoObj.title+'" />'+
			'<div class="description"><h3>'+photoObj.title+'</h3><p>'+photoObj.description._content+'</p></div>';

	return '<div id="'+photoObj.id+'" class="photoFull">'+str+'</div>';
}

/* open the overbox containing on big image at a time 
	@id: the id of the photo to be shown in the overbox
*/
FlickrFolio.prototype.openOverBox = function(id) {
	'use strict';
	var that = this;

	if($("#overbox").css("display") === 'none'){
		return;
	}

	//we don't want the background page to scroll, while the overbox is open
	$("#overbox .photoFull").addClass("hidden");

	$("#"+id).removeClass("hidden");
	$("#overbox").addClass("shown");

	return;
}

/* closes the overbox */
FlickrFolio.prototype.closeOverbox = function() {
	'use strict';
	var that = this;

	$("#overbox").removeClass("shown");

	return;
}

/* shows the previous picture in the overbox */
FlickrFolio.prototype.prevOverbox = function() {
	'use strict';
	var that = this;

	var $curr = $(".photoFull:not(.hidden)").first();

	$curr.addClass("hidden");

	var $dest = $curr.prev(".photoFull");
	if($dest.length <= 0){
		$dest = $(".photoFull").last();
	}
	$dest.removeClass("hidden");

	return;
}

/* shows the next picture in the overbox */
FlickrFolio.prototype.nextOverbox = function() {
	'use strict';
	var that = this;
	
	var $curr = $(".photoFull:not(.hidden)").first();

	$curr.addClass("hidden");

	var $dest = $curr.next(".photoFull");
	if($dest.length <= 0){
		$dest = $(".photoFull").first();
	}
	$dest.removeClass("hidden");

	return;
}


var flickrFolio = null;

$(document).ready(function(){
	
	flickrFolio = new FlickrFolio();

	//set the name of the portfolio
	$(".portfolioname").html(flickrFolio.pageTitle);

	flickrFolio.init();

});
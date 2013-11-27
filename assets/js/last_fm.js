/* jlastfm 
   couple notes;
    so there is a issue where a function is called (mostly when nested in a promise) where we lose the context of 'this'
    I have created var parentThis to deal with that fact and passed it in. This seems like a total hack and not the proper
    way to do things. If anyone ever sees this code and knows the correct way of doing this please give me a shout.

    I understand jquery has a way of doing things better (and perhaps this should be a jquery plugin?)
    
        -jjrh (Nov 2013).
 */

var jlastfm = function(username,selector){

    
    this.selector = selector;
    this.rss_urls = {
	"last_10_songs": "http://ws.audioscrobbler.com/1.0/user/"+username+"/recenttracks.rss",
	"loved_tracks": "http://ws.audioscrobbler.com/2.0/user/"+username+"/lovedtracks.rss",
	
    }
    this.xml_urls = {

	"artists": {
	    "weeklyartistchart": "http://ws.audioscrobbler.com/2.0/user/"+username+"/weeklyartistchart.xml",
	    "top_artists": "http://ws.audioscrobbler.com/2.0/user/"+username+"/topartists.xml",
	    "top_artists_3month": "http://ws.audioscrobbler.com/2.0/user/"+username+"/topartists.xml?period=3month",
	    "top_artists_6month": "http://ws.audioscrobbler.com/2.0/user/"+username+"/topartists.xml?period=6month",
	    "top_artists_12month": "http://ws.audioscrobbler.com/2.0/user/"+username+"/topartists.xml?period=12month",
	},
	"tracks": {
	    "weeklytrackchart": "http://ws.audioscrobbler.com/2.0/user/"+username+"/weeklytrackchart.xml",
	    "top_tracks": "http://ws.audioscrobbler.com/2.0/user/"+username+"/toptracks.xml",
	    "top_tracks_3month": "http://ws.audioscrobbler.com/2.0/user/"+username+"/toptracks.xml?period=3month",
	    "top_tracks_6month": "http://ws.audioscrobbler.com/2.0/user/"+username+"/toptracks.xml?period=6month",
	    "top_tracks_12month": "http://ws.audioscrobbler.com/2.0/user/"+username+"/toptracks.xml?period=12month",
	}
    }

    this.stat_data = {"artists":{},"tracks":{},"weeklycharts":{} }    
}

jlastfm.prototype.init = function(){
    $(this.selector).html(this.html_template);
    this.xml_all();
    this.get_last_10();
}

    /* do RSS stuff here... */
jlastfm.prototype.get_last_10 = function(){
    var parentThis = this;
    var RSS_URL = this.rss_urls["last_10_songs"]
    $.ajax({
	url: document.location.protocol + '//ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=10&callback=?&q=' + encodeURIComponent(RSS_URL),
	dataType: 'json',
	success: function(data) {
	    parentThis.build_dom_rss(data.responseData.feed); //dump_data(data.responseData.feed,selector);
	}
    });
}

    //"Ryan Paris – Dolce Vita (Part I - Vocal) (Extended Disco Mix)"
jlastfm.prototype.build_dom_rss = function(data){
    $("#last_10_songs").append("<ul>");
    entries = data.entries;
    for(var i=0; i< entries.length; i++){
	/*
	  entries[x] = {
	  author: "",
	  categories: Array[0],
	  content: "http://www.last.fm/music/Accidental+Heroes",
	  contentSnippet: "http://www.last.fm/music/Accidental+Heroes",
	  link: "http://www.last.fm/user/slicenice#1385069306",
	  publishedDate: "Thu, 21 Nov 2013 13:28:26 -0800",
	  title: "Accidental Heroes – Precinct 13"
	  }
	  Taking this example we can see content does point to the artists page. Still, content seems questionable as to 
	  what it implies. Current method of hacking up the song title seems appropiate.

	  *** one note, the character between the artist and title, looks like a "-". It is not. It's a unicode character: \u2013
	  see: http://www.ascii.cl/htmlcodes.htm
	  
	*/

	var str = entries[i].title;
	var artist = {"title":str.split("\u2013")[0].trim(),
		      "url":"www.last.fm/music/"+str.split("\u2013")[0].trim().replace(" ","+")
		     }
	var track = {"title": str.split("\u2013")[1].trim(),
		     "url": artist.url + "/_/" + str.split("\u2013")[1].trim().replace(" ","+")
		    }

	
	
	var plays = "";
	var rank = "";

	/* trying to get /when/ it was played.
	 * we run into some issues with spacing
	 */
	var publish_date = new Date(entries[i].publishedDate);
	var diff = new Date() - publish_date;

	diff = ((diff/1000)/60)/60;
	
	diff = Math.round(diff);
	if(diff >= 24){
	    format_string = publish_date.toString();
	    format_string = format_string.split(" ");
	    format_string = format_string[1]+" "+format_string[2]+","+format_string[4].split(":")[0]+":"+format_string[4].split(":")[1];
//	    console.log(format_string);
	    plays = format_string
	}
	else{
//	    console.log(diff + " hours ago");
	    plays = diff + "h";
	}
	

	
	var html_entry = this.make_entry_template(artist,track,rank,plays);
	$("#last_10_songs").append(html_entry);
    }
    $("#last_10_songs").append("</ul>");
    
}

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

jlastfm.prototype.xml2json = function(url,type,period){
    var def = $.Deferred();
    var t = this;
    $.get(url, function(xml){
	t.stat_data[type][period] = $.xml2json(xml);
	def.resolve();
    });
    return def.promise();
}


jlastfm.prototype.xml_all = function(){
    /* I don't understand why I can't pass in a array of promises */
    var parentThis = this;
    $.when(this.xml2json(this.xml_urls["tracks"]["weeklytrackchart"],"weeklycharts","weeklytrackchart"),
	   this.xml2json(this.xml_urls["tracks"]["top_tracks"],"tracks","top_tracks"), 
	   this.xml2json(this.xml_urls["tracks"]["top_tracks_3month"],"tracks","top_tracks_3month" ),
	   this.xml2json(this.xml_urls["tracks"]["top_tracks_6month"],"tracks","top_tracks_6month"),
	   this.xml2json(this.xml_urls["tracks"]["top_tracks_12month"],"tracks","top_tracks_12month"),
	   this.xml2json(this.xml_urls["artists"]["weeklyartistchart"],"weeklycharts","weeklyartistchart"),
	   this.xml2json(this.xml_urls["artists"]["top_artists"],"artists","top_artists"), 
	   this.xml2json(this.xml_urls["artists"]["top_artists_3month"],"artists","top_artists_3month"),
	   this.xml2json(this.xml_urls["artists"]["top_artists_6month"],"artists","top_artists_6month"),
	   this.xml2json(this.xml_urls ["artists"]["top_artists_12month"],"artists","top_artists_12month")
	  ).done(function(d,t,x){
	      // bit of a hack here, we need to pass in the context of this to the child elements
	      parentThis.build_dom_xml(d,t,x,parentThis); 
	  });
}


/* data should look like:

 */

jlastfm.prototype.make_entry_template = function(artist,track,rank,plays){
    html_dump = "<li>";
    html_dump = html_dump+"<span>";
    html_dump = html_dump+"<b>"+rank+". </b>"
    html_dump = html_dump+"<a href='http://"+artist.url+"'>"+artist.title+"</a>";
    if(track.title != ""){
	html_dump = html_dump+" - ";
	html_dump = html_dump+"<a href='http://"+track.url+"'>"+track.title+"</a>";
    }
    // html_dump = html_dump+"<a href='"+track.url+"'>"+track.title+"</a>";

    html_dump = html_dump+"</span>";

    
    html_dump = html_dump+"<span class='plays pull-right' value='"+plays+"'>"+plays+"</span>";
    html_dump = html_dump+"</li>";

    return html_dump
}

jlastfm.prototype.build_tracks = function(){    
    var parentThis = this;
    $.each(this.stat_data["tracks"], function(k,v){
	var track_type = v["toptracks"]["@attributes"]["type"];
	var tracks = v["toptracks"]["track"];

	$("#songs_"+track_type).append("<ul>");
	for(var i = 0; i< tracks.length; i++){
	    var artist = {"title":tracks[i].artist.name.value,
			  "url": tracks[i].artist.url.value
			 }
	    var track = {"title": tracks[i].name.value,
			 "url":tracks[i].url.value
			}

	    var rank = tracks[i]['@attributes'].rank;
	    var plays = tracks[i].playcount.value;

	    var html_entry = parentThis.make_entry_template(artist,track,rank,plays);
	    $("#songs_"+track_type).append(html_entry)
	}
	$("#songs_"+track_type).append("</ul>");
    });
}

jlastfm.prototype.build_artists = function(){
    /* generate artist html stuff .... */
    var parentThis = this;
    $.each(this.stat_data["artists"], function(k,v){
	var artist_type = v["topartists"]["@attributes"]["type"];
	var artists = v["topartists"]["artist"];
	
	$("#artists_"+artist_type).append("<ul>");
	
	for(var i = 0; i< artists.length; i++){
	    var artist = {"title":artists[i].name.value,
			  "url":artists[i].url.value
			 }
	    var track = {"title":"",
			 "url":""
			}
	    var plays = artists[i].playcount.value;
	    var rank = artists[i]['@attributes'].rank;

	    var html_entry = parentThis.make_entry_template(artist,track,rank,plays);
	    $("#artists_"+artist_type).append(html_entry)
	}
	$("#artists_"+artist_type).append("</ul>");
    });


    
}


jlastfm.prototype.build_charts = function(){
    var parentThis = this;
    $.each(this.stat_data["weeklycharts"]["weeklytrackchart"], function(k,v){
	// var track_type = v["toptracks"]["@attributes"]["type"];
	var track_type = "week";
	var tracks = v["track"];
	$("#songs_"+track_type).append("<ul>");
	for(var i = 0; i< tracks.length && i<10; i++){
	    var artist = {"title": tracks[i].artist.value,
			  "url": tracks[i].url.value.split("_/")[0] // stupid hack, they don't give me the url directly.
			 }
	    var track = {"title":tracks[i].name.value,
			 "url":tracks[i].url.value
			}
	    var plays = tracks[i].playcount.value;
	    var rank = tracks[i]['@attributes'].rank;

	    var html_entry = parentThis.make_entry_template(artist,track,rank,plays);
	    $("#songs_"+track_type).append(html_entry)
	}
	$("#songs_"+track_type).append("</ul>");
    }); 

    /* generate weekly artists charts .... */
    $.each(this.stat_data["weeklycharts"]["weeklyartistchart"], function(k,v){
	var artist_type = "week" //v["weeklyartistchart"]["@attributes"]["type"];
	var artists = v["artist"];
	
	$("#artists_"+artist_type).append("<ul>");
	for(var i = 0; i< artists.length && i<10; i++){
	    var artist = {"title":artists[i].name.value,
			  "url": artists[i].url.value
			 }
	    var track = {"title":"",
			 "url":"",
			}

	    var plays = artists[i].playcount.value;
	    var rank = artists[i]['@attributes'].rank

	    var html_entry = parentThis.make_entry_template(artist,track,rank,plays);
	    $("#artists_"+artist_type).append(html_entry);
	}
	$("#artists_"+artist_type).append("</ul>");
    });
}

jlastfm.prototype.build_dom_xml = function(t,d,x,parentThis){ //function(stat_data_selector,id_selector,t){
    /* generate tracks html stuff .... */
    parentThis.build_tracks();
    parentThis.build_artists();
    parentThis.build_charts();

}

//jlastfm.prototype.html_template = "asdf";
jlastfm.prototype.html_template = '<div id="lastfm"><h3>Last.fm</h3><ul class="nav nav-tabs"><li class="active"><a href="#last_10_songs" data-toggle="tab">Last 10 songs</a></li><li><a href="#songs" data-toggle="tab">Songs</a></li><li><a href="#artists" data-toggle="tab">Artists</a></li></ul><div class="tab-content small"><div class="tab-pane active" id="last_10_songs"></div><div class="tab-pane" id="songs"><ul class="nav nav-tabs"><li class="active"><a href="#songs_week" data-toggle="tab">week</a></li><li><a href="#songs_3month" data-toggle="tab">3 month</a></li><li><a href="#songs_6month" data-toggle="tab">6 month</a></li><li><a href="#songs_12month" data-toggle="tab">12 month</a></li><li><a href="#songs_overall" data-toggle="tab">Overall</a></li></ul><div class="tab-content"><div class="tab-pane active" id="songs_week"></div><div class="tab-pane" id="songs_3month"></div><div class="tab-pane" id="songs_6month"></div><div class="tab-pane" id="songs_12month"></div><div class="tab-pane" id="songs_overall"></div></div></div><div class="tab-pane" id="artists"><ul class="nav nav-tabs"><li class="active"><a href="#artists_week" data-toggle="tab">week</a></li><li><a href="#artists_3month" data-toggle="tab">3 month</a></li><li><a href="#artists_6month" data-toggle="tab">6 month</a></li><li><a href="#artists_12month" data-toggle="tab">12 month</a></li><li><a href="#artists_overall" data-toggle="tab">Overall</a></li></ul><div class="tab-content"><div class="tab-pane active" id="artists_week"></div><div class="tab-pane" id="artists_3month"></div><div class="tab-pane" id="artists_6month"></div><div class="tab-pane" id="artists_12month"></div><div class="tab-pane" id="artists_overall"></div></div></div></div>'

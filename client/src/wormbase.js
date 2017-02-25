/* eslint-disable */

/*!
 * WormBase
 * http://wormbase.org/
 *
 * WormBase copyright © 1999-2011
 * California Institute of Technology,
 * Ontario Institute for Cancer Research,
 * Washington University at St. Louis, and
 * The Wellcome Trust Sanger Institute.
 *
 * WormBase is supported by a grant from the
 * National Human Genome Research Institute at the
 * US National Institutes of Health # P41 HG02223 and the
 * British Medical Research Council.
 *
 * author: Abigail Cabunoc
 *         abigail.cabunoc@oicr.on.ca
 */
import jQuery from 'jquery';
import { LegacyPlugin as Plugin } from './utils';
import FpkmPlots from './visualizations/fpkm';
import {
  setupCytoscapePersonLineage,
  setupCytoscapeInteraction,
  setupCytoscapePhenGraph,
} from './visualizations/graphs';


+function(window, document, undefined){
  var location = window.location,
      $jq = jQuery.noConflict();

  var WB = (function(){
    var timer,
        notifyTimer,
        cur_search_type = 'all',
        cur_search_species_type = '',
        body = $jq("#wrap"),
        reloadLayout = 0, //keeps track of whether or not to reload the layout on hash change
        loadcount = 0;

    function init(){
      var pageInfo = $jq("#header").data("page"),
          searchAll = $jq("#all-search-results"),
          sysMessage = $jq("#top-system-message").children(".system-message-close"),
          history_on = (pageInfo['history'] === '1') ? 1 : undefined;
      if(history_on){
        $jq.post("/rest/history", { 'ref': pageInfo['ref'] , 'name' : pageInfo['name'], 'id':pageInfo['id'], 'class':pageInfo['class'], 'type': pageInfo['type'], 'is_obj': pageInfo['is_obj'] });
      }

      if($jq(".user-history").size()>0){
        histUpdate(history_on);
      }

      search_change(pageInfo['class']);
      if(sysMessage.size()>0) {systemMessage('show'); sysMessage.click(function(){ systemMessage('hide', sysMessage.data("id")); });}

      comment.init(pageInfo);
      issue.init(pageInfo);


      updateCounts(pageInfo['ref']);
      if(pageInfo['notify']){ displayNotification(pageInfo['notify']); }

      navBarInit();
      pageInit();

      if(searchAll.size()>0) {
        var searchInfo = searchAll.data("search");
        allResults(searchInfo['type'], searchInfo['species'], searchInfo['query']);
      } else {
        if($jq(".star-status-" + pageInfo['wbid']).size()>0){$jq(".star-status-" + pageInfo['wbid']).load("/rest/workbench/star?wbid=" + pageInfo['wbid'] + "&name=" + pageInfo['name'] + "&class=" + pageInfo['class'] + "&type=" + pageInfo['type'] + "&id=" + pageInfo['id'] + "&url=" + pageInfo['ref'] + "&save_to=" + pageInfo['save'] + "&is_obj=" + pageInfo['is_obj']);}
        widgetInit();
      }
      effects();
      Plugin.getPlugin("placeholder", function(){
        $jq('input, textarea').placeholder();
      });

      if($jq(".lightbox").size()){
        WB.getPlugin("colorbox", function(){
          $jq(".lightbox").colorbox();
        });
      }

    }


    function histUpdate(history_on){
      var uhc = $jq("#user_history-content");

      ajaxGet($jq(".user-history"), "/rest/history?sidebar=1", {cache : false});
      if(uhc.size()>0 && uhc.text().length > 4) ajaxGet(uhc, "/rest/history", {cache : false});
      if(history_on){
        setTimeout(histUpdate, 6e5); //update the history every 10min
      }
      reloadWidget('activity');
      return;
    }

    function ajaxError(xhr){
          var error = xhr.responseText && $jq(xhr.responseText.trim()).find(".error-message-technical").html() || '',
              statusText = ((xhr.statusText ===  'timeout') && xhr.requestURL) ? 'timeout: <a href="' + xhr.requestURL + '" target="_blank">try going to the widget directly</a>': xhr.statusText;
          return '<div class="ui-state-error ui-corner-all"><p><strong>Sorry!</strong> An error has occured.</p>'
                  + '<p><a href="/tools/support?url=' + location.pathname
                  + (error ? '&msg=' + encodeURIComponent(error.replace(/^\s+|\s+$|\n/mg, '')) : '')
                  + '"><button class="ui-state-active"><span>Let us know</span></button></a></p><p>' + error + '</p><p>' + statusText + '</p></div>';
    }

    function navBarInit(){
      searchInit();
      $jq("#nav-bar").find("ul li a.trigger").bind('touchstart', function(e) {
        // on touch device, touch start should open dropdown
        // prevent touch event follow href
        e.preventDefault();
        $jq(this).parent().trigger('mouseenter');
      });

      $jq("#nav-bar").find("ul li").hover(function () {
          var navItem = $jq(this);
          $jq("div.columns>ul").hide();


          if(timer){
            // remove timer for pending dropdown hide operation
            clearTimeout(timer);
            timer = undefined;
          }

          // hide all sibling dropdowns immediately
          // instead of waiting for timeout to complete
          navItem.siblings("li").children("div.wb-dropdown").stop(true, false);
          navItem.siblings("li").children("div.wb-dropdown").hide();
          navItem.siblings("li").children("a").removeClass("hover");

          navItem.children("div.wb-dropdown").delay(500).slideDown(400);
          navItem.children("a").addClass("hover");
        }, function () {
          var toHide = $jq(this);
          if(timer){
            // ensure only one timer is active
            clearTimeout(timer);
            timer = undefined;
          }
          timer = setTimeout(function() {
            // delay hiding dropdown
            toHide.children("div.wb-dropdown").stop(true, false);
            toHide.children("div.wb-dropdown").slideUp(200);
            toHide.children("a").removeClass("hover");
          }, 300);
        });

        ajaxGet($jq(".status-bar"), "/rest/auth", {cache : false}, function(){
          $jq("#bench-status").load("/rest/workbench");
          var login = $jq("#login");
          if(login.size() > 0){
            login.click(function(){
              $jq(this).toggleClass("open ui-corner-top").siblings().toggle();
            });
          }else{
            $jq("#logout").click(function(){
                // avoid browser caching /logout link
                $jq.ajax({
                    url: "/logout?redirect=" + window.location.href,
                    cache: false,
                    success: function(){
                        navBarInit();
                    }
                });
            });
          }
        });
    }

    function pageInit(){
      var personSearch = $jq("#person-search"),
          colDropdown = $jq("#column-dropdown");

      operator();

      $jq("#print").click(function() {
        var layout = location.hash.replace('#',''),
            print = $jq(this);
          $jq.ajax({
              type: "POST",
              url : '/rest/print',
              data: {layout:layout},
              beforeSend:function(){
                setLoading(print);
              },
              success: function(data){
                print.html('');
                location.href=data;
              },
              error: function(xhr,status,error) {
                print.html(ajaxError(xhr));
              }
            });
      });

      $jq(".section-button").click(function() {
          var section = $jq(this).attr('wname');
          $jq("#nav-" + section).trigger("open");
          Scrolling.goToAnchor(section);
      });

      if($jq(".sortable").size()>0){
        $jq(".sortable").sortable({
          handle: '.widget-header, #widget-footer',
          items:'li.widget',
          placeholder: 'placeholder',
          connectWith: '.sortable',
          opacity: 0.6,
          forcePlaceholderSize: true,
          update: function(event, ui) { Layout.updateLayout(); }
        });
      }


      colDropdown.hover(function () {
          if(timer){
            $jq("#nav-bar").find("ul li .hover").removeClass("hover");
            $jq("#nav-bar").find("div.wb-dropdown").hide();
            clearTimeout(timer);
            timer = undefined;
          }
          colDropdown.children("ul").show();
        }, function () {
          if(timer){
            clearTimeout(timer);
            timer = undefined;
          }
          if(colDropdown.find("#layout-input:focus").size() === 0){
            timer = setTimeout(function() {
                  colDropdown.children("ul").hide();
                }, 300)
          }else{
            colDropdown.find("#layout-input").blur(function(){
              timer = setTimeout(function() {
                  colDropdown.children("ul").hide();
                }, 600)
            });
          }
        });

      $jq("#nav-min").click(function() {
        var nav = $jq(".navigation-min").add("#navigation"),
            ptitle = $jq("#page-title"),
            w = nav.width(),
            msg = "open sidebar",
            marginLeft = '-1em';
        if(w === 0){ w = '12em'; msg = "close sidebar"; marginLeft = 175; }else { w = 0;}
        nav.stop(false, true).animate({width: w}).show().children("#title").toggleClass("closed").children("div").toggle();
        ptitle.stop(false, true).animate({marginLeft: marginLeft}).show();
        $jq(this).attr("title", msg).children("#nav-min-icon").toggleClass("ui-icon-triangle-1-w ui-icon-triangle-1-e");
        Layout.updateLayout();
        body.toggleClass("sidebar-hidden");
      });

      // Should be a user supplied site-wide option for this.
      // which can be over-ridden on any widget.
      // Toggle should empty look of button
      $jq("#hide-empty-fields").click(function() {
            body.toggleClass("show-empty");
      });

      if(personSearch.size()>0){
          ajaxGet(personSearch, personSearch.attr("href"), undefined, function(){
            checkSearch(personSearch);
            personSearch.delegate(".results-person .result li a", 'click', function(){
                $jq(".ui-state-highlight").removeClass("ui-state-highlight");
                var wbid = $jq(this).attr("href").split('/').pop();
                $jq.ajax({
                    type: "GET",
                    url: "/auth/info/" + wbid,
                    dataType: 'json',
                    success: function(data){
                          var linkAccount = $jq("#link-account");
                          if(linkAccount.size()===0){
                            $jq("input#name").attr("value", data.fullname).attr("disabled", "disabled");
                            var email = new String(data.email);
                            if(data.email && data.status_ok){
                              var re = new RegExp($jq("input#email").val(),"gi");
                              if (((email.match(re))) || !($jq("input#email").val())){
                                $jq("#email").attr("disabled", "disabled").parent().hide();
                              }
                              $jq("input#wbemail").attr("value", email).parent().show();
                            }else{
                              $jq("input#wbemail").attr("value", "").parent().hide();
                              $jq("#email").removeAttr("disabled").parent().show();
                            }
                            $jq(".register-notice").html("<span id='fade'>" +  data.message + "</span>").show();
                            $jq("input#wbid").attr("value", data.wbid);
                          }else{
                            $jq("input#wbid").attr("value", data.wbid);
                            $jq("input#email").attr("value", data.email);
                            linkAccount.removeAttr("disabled");
                            $jq("input#confirm").attr("value", "");
                            var emails = ["[% emails.join('", "') %]"];
                            if(data.email && data.status_ok){
                              var e = "" + data.email;
                              for(var i=0; i<emails.length; i++){
                                var re = new RegExp(emails[i],"gi");
                                if (e.match(re)){
                                  $jq(".register-notice").css("visibility", "hidden");
                                  $jq("input#confirm").attr("value", 1);
                                  return;
                                }
                              }
                            }else{
                              linkAccount.attr("disabled", 1);
                            }
                            $jq(".register-notice").html("<span id='fade'>" +  data.message + "</span>").css("visibility", "visible");

                          }
                      },
                    error: function(xhr,status,error) {
                        $jq(".error").prepend(ajaxError(xhr));
                      }
                });
                $jq(this).parent().parent().addClass("ui-state-highlight");
                return false;
            });
          });
      }
    }




    function widgetInit(){
      var widgetHolder = $jq("#widget-holder"),
          widgets = $jq("#widgets"),
          listLayouts = $jq(".list-layouts"),
          layout;
      if(widgetHolder.size()===0){
        $jq("#content").addClass("bare-page");
        return;
      }
      Scrolling.sidebarInit();

      window.onhashchange = Layout.readHash;
      window.onresize = Layout.resize;

      if(location.hash.length > 0){
        Layout.readHash();
      }else if(layout = widgetHolder.data("layout")){
        Layout.resetPageLayout(layout);
      }else{
        Layout.openAllWidgets();
      }

//       if(listLayouts.children().size()==0){ajaxGet(listLayouts, "/rest/layout_list/"  + $jq(".list-layouts").data("class") + "?section=" + $jq(".list-layouts").data("section"));}

      // used in sidebar view, to open and close widgets when selected
      widgets.find(".module-load").click(function() {
        var widget_name = $jq(this).attr("wname"),
            nav = $jq("#nav-" + widget_name),
            content = $jq("#" + widget_name + "-content");
        if(!nav.hasClass('ui-selected')){
          if(content.text().length < 4){
              var column = ".left",
                  lWidth = Layout.getLeftWidth(widgetHolder);
              if(lWidth >= 90){
                if(widgetHolder.children(".right").children(".visible").height()){
                  column = ".right";
                }
              }else{
                var leftHeight = height(widgetHolder.children(".left").children(".visible"));
                var rightHeight = height(widgetHolder.children(".right").children(".visible"));
                if (rightHeight < leftHeight){ column = ".right"; }
              }
              openWidget(widget_name, nav, content, column);
          }else{
            content.parents("li").addClass("visible");
            nav.addClass("ui-selected");
            moduleMin(content.prev().find(".module-min"), false, "maximize");
          }
        }
        Scrolling.goToAnchor(widget_name);
        Layout.updateLayout();
        Scrolling.sidebarMove();
        return false;
      });



          // used in sidebar view, to open and close widgets when selected
      widgets.find(".module-close").click(function() {
        var widget_name = $jq(this).attr("wname"),
            nav = $jq("#nav-" + widget_name),
            content = $jq("#" + widget_name + "-content");

          Scrolling.scrollUp(content.parents("li"));
          moduleMin(content.prev().find(".module-min"), false, "minimize", function(){
            nav.removeClass("ui-selected");
            content.parents("li").removeClass("visible");
            Layout.updateLayout();
          });

        Scrolling.sidebarMove();
        return false;
      });


      function height(list){
        var len = 0;
        for(var i=-1, l = list.length; i++<l;){
          len += list.eq(i).height();
        }
        return len;
      }







      widgetHolder.children("#widget-header").disableSelection();

      widgetHolder.find(".module-max").click(function() {
        var module = $jq(this).parents(".widget-container"),
    //     if(module.find(".cboxElement").trigger('click').size() < 1){
            clone = module.clone(),
    //       clone.find(".module-max").remove();
    //       clone.find(".module-close").remove();
    //       clone.find(".module-min").remove();
    //       clone.find("#widget-footer").remove();
    //       clone.find("h3").children(".ui-icon").remove();
    //       clone.css("min-width", "400px");
    //       var cbox = $jq('<a class="cboxElement" href="#"></a>');
    //       cbox.appendTo(module).hide();
    //       cbox.colorbox({html:clone, title:"Note: not all effects are supported while widget is maximized", maxWidth:"100%"}).trigger('click');
    //     }

    // code for external pop out window - if we need that
          popout = window.open("", "test", "height=" + module.height() + ",width=" + module.width());
        popout.document.write(document.head.innerHTML);
        popout.document.write(clone.html());
      });

      // used in sidebar view, to open and close widgets when selected
      widgets.find(".module-load, .module-close").bind('open',function() {
        var widget_name = $jq(this).attr("wname"),
            nav = $jq("#nav-" + widget_name),
            content = $jq("#" + widget_name + "-content");

        openWidget(widget_name, nav, content, ".left");
        return false;
      });

      widgetHolder.find(".module-min").click(function() {
        moduleMin($jq(this), true);
      });



      widgetHolder.find(".reload").click(function() {
        reloadWidget($jq(this).attr("wname"));
      });

      $jq(".feed").click(function() {
        var url=$jq(this).attr("rel"),
            div=$jq(this).parent().next("#widget-feed");
        div.filter(":hidden").empty().load(url);
        div.slideToggle('fast');
      });
    }

    function effects(){
      var content = $jq("#content");
      $jq("body").delegate(".toggle", 'click', function(){
            var tog = $jq(this);
            tog.toggleClass("active").next().slideToggle("fast", function(){
                if($jq.colorbox){ $jq.colorbox.resize(); }
                Scrolling.sidebarMove();
              });
            if(tog.hasClass("load-toggle")){
              if (tog.attr("iframe")) {
                var iframeContainer = tog.attr("iframe")
                      ? tog.next().find(tog.attr("iframe"))
                      : tog.next();
                iframeContainer.html('<iframe src="' + tog.attr("href") + '"></iframe>');
              } else {
                  ajaxGet(tog.next(), tog.attr("href"));
              }
              tog.removeClass("load-toggle");
            }
            tog.children(".ui-icon").toggleClass("ui-icon-triangle-1-e ui-icon-triangle-1-s");
            return false;
      });

      content.delegate(".evidence", 'click', function(){
        var ev = $jq(this);
        ev.children(".ev-more").toggleClass('open').children('.ui-icon').toggleClass('ui-icon-triangle-1-s ui-icon-triangle-1-n');
        ev.children(".ev").toggle('fast');
      });

      content.delegate(".slink", 'mouseover', function(){
          var slink0 =  $jq(this);
          var slinkAll;

          // occasionally, several iamges needs to be be grouped into a set
          // of slides
          var grpId = slink0.attr('data-group');
          if (grpId){
            slinkAll = slink0.closest('td').find('.slink[data-group='+ grpId +']'); //all slinks in the cell that will be grouped
          }

          Plugin.getPlugin("colorbox", function(){
            (slinkAll || slink0).each(function(){
              var slink = $jq(this);
              slink.colorbox({data: slink.attr("href"),
                            rel: slink.attr("data-group"),
                            width: "800px",
                            // height: "550px",
                            scrolling: false,
                           onComplete: function() {$jq.colorbox.resize(); },
                            title: function(){ return slink.attr('title'); }
                });
            });
          });
      });

      content.delegate(".bench-update", 'click', function(){
        var update = $jq(this),
            wbid = update.attr("wbid"),
            save_to = update.attr("save_to"),
            url = update.attr("ref") + '?name=' + escape(update.attr("name")) + "&url=" + escape(update.attr("href")) + "&save_to=" + save_to + "&is_obj=" + update.attr("is_obj");
        $jq(".star-status-" + wbid).find("#save").toggleClass("ui-icon-star-yellow ui-icon-star-gray");
        $jq("#bench-status").load(url, function(){
          if($jq("div#" + save_to + "-content").text().length > 3){
            reloadWidget(save_to, 1);
          }
        });
        return false;
      });

      $jq("body").delegate(".generate-file-download", 'click', function(e){
          var filename = $jq(this).find("#filename").text(),
              content = $jq(this).find("#content").text();
          Plugin.getPlugin("generateFile", function(){
          $jq.generateFile({
              filename    : filename,
              content     : content,
              script      : '/rest/download'
          });
        });
      });

    }

    function moduleMin(button, hover, direction, callback) {
      var module = $jq("#" + button.attr("wname") + "-content");

      if (direction && (button.attr("title") !== direction) ){ if(callback){ callback()} return; }
      module.slideToggle("fast", function(){Scrolling.sidebarMove(); if(callback){ callback()}});
      button.toggleClass("ui-icon-triangle-1-s ui-icon-triangle-1-e").closest(".widget-container").toggleClass("minimized");
      if(hover)
        button.toggleClass("ui-icon-circle-triangle-e ui-icon-circle-triangle-s");
      (!button.hasClass("show")) ? button.attr("title", "maximize").addClass("show") : button.attr("title", "minimize").removeClass("show");

      Layout.updateLayout();
    }


    function displayNotification (message){
        if(notifyTimer){
          clearTimeout(notifyTimer);
          notifyTimer = undefined;
        }
        var notification = $jq("#notifications");
        notification.css({"display":"flex"});
        notification.show().children("#notification-text").text(message);

        notifyTimer = setTimeout(function() {
              notification.fadeOut(400);
            }, 3e3)

        notification.click(function() {
          if(notifyTimer){
            clearTimeout(notifyTimer);
            notifyTimer = undefined;
          }
          $jq(this).hide();
        });
    }



   function systemMessage(action, messageId){
     var systemMessage = $jq(".system-message"),
         notifications = $jq("#notifications");
      if(action === 'show'){
//         systemMessage.show().css("display", "block").animate({height:"20px"}, 'slow');
        notifications.css("top", "20px");
        Scrolling.set_system_message(20);
      }else{
        systemMessage.animate({height:"0px"}, 'slow', undefined,function(){ $jq(this).hide();});
        $jq.post("/rest/system_message/" + messageId);
        Scrolling.set_system_message(0);
        notifications.css("top", "0");
        Scrolling.sidebarMove();
      }
  }


    function setLoading(panel) {
      panel.html('<div class="loading"><img src="/img/ajax-loader.gif" alt="Loading..." /></div>');
    }

    function ajaxGet(ajaxPanel, $url, settings, callback) {
      settings = settings || {};
      $jq.ajax({
        url: $url,
        cache: settings.hasOwnProperty('cache') ? settings.cache : true,
        beforeSend:function(xhr){
          if(!settings.noLoadImg){ setLoading(ajaxPanel); }
          xhr.requestURL = $url;
        },
        success:function(data){
          if (settings.success){
            settings.success(data);
          }else{
            ajaxPanel.html(data);
            WB.tooltipInit();
          }
        },
        error:function(xhr, textStatus, thrownError){
          ajaxPanel.html(ajaxError(xhr));
        },
        complete:function(XMLHttpRequest, textStatus){
          if(callback){ callback(); }
        }
      });
    }

    function tooltipInit(){
      // for compatibility with jbrowse
      if ((window.location.pathname || '').match('/tools/genome/jbrowse')) return;

      WB.getPlugin("qtip", function(){
        if (!$jq('[title]').qtip) return; // for compatibility with jbrowse
        $jq('[title]').qtip({ // Grab some elements to apply the tooltip to
          content: {
            attr: 'title'
          },
          style: {
            classes: 'qtip-light qtip-shadow qtip-tooltip'
          },
          position: {
            my: 'top left',
            at: 'bottom center',
          }
        });
      });
    };

      function operator(){

        $jq("#issue-box-tab").click(function(){
          var isBox = $jq(this).parent();
          isBox.toggleClass("minimize");//.children().toggle();
          // isBox.animate({width: (isBox.hasClass("minimize")) ? "1em" : "14em"})
        });
    }





    /***************************/
    // Search Bar functions
    // author: Abigail Cabunoc
    // abigail.cabunoc@oicr.on.ca
    /***************************/

    //The search bar methods
    function searchInit(){
      var searchBox = $jq("#Search"),
          searchBoxDefault = "search...",
          searchForm = $jq("#searchForm"),
          lastXhr;

      searchBox.focus(function(e){
        $jq(this).addClass("active");
      });
      searchBox.blur(function(e){
        $jq(this).removeClass("active");
      });

      (function(){
        // Extend the autocomplete plugin to handle html in items
        // Adapted based on https://github.com/scottgonzalez/jquery-ui-extensions/blob/master/src/autocomplete/jquery.ui.autocomplete.html.js by Scott González (http://scottgonzalez.com)

        var proto = $jq.ui.autocomplete.prototype,
	        initSource = proto._initSource;

        function filter( array, term ) {
          var matcher = new RegExp( $jq.ui.autocomplete.escapeRegex(term), "i" );
          return $jq.grep( array, function(value) {
		    return matcher.test($jq( "<div>" ).html( value.label || value.value || value ).text());
	      });
        }

        $jq.extend( proto, {
	      _initSource: function() {
		    if ( this.options.html && $jq.isArray(this.options.source) ) {
			  this.source = function( request, response ) {
			    response( filter( this.options.source, request.term ) );
			  };
		    } else {
			  initSource.call( this );
		    }
	      },

	      _renderItem: function( ul, item) {
		    return $jq( "<li></li>" )
			  .data( "item.autocomplete", item )
			  .append( $jq( "<a></a>" )[ this.options.html ? "html" : "text" ]( item.labelHtml || item.label ) )
			  .appendTo( ul );
	      }
        });
      })();

      searchBox.autocomplete({
        source: function( request, response ) {
          lastXhr = $jq.getJSON( "/search/autocomplete/" + cur_search_type, request, function( data, status, xhr ) {
            if ( xhr === lastXhr ) {
              data.forEach(function(dat) {
                var speciesHtml = (dat.taxonomy && dat.taxonomy.species) ? '<span class="species">'  + dat.taxonomy.genus + ' ' + dat.taxonomy.species + '</span>' : '';
                dat.labelHtml = '<span class="autocomplete-item-wrapper"><span>' + dat.label + '</span>' + speciesHtml + '</span>';
              });
              response( data );
            }
          });
        },
        minLength: 2,
        select: function( event, ui ) {
          location.href = ui.item.url;
        },
        html: true
      });


    }



    function search(box) {
        if(!box){ box = "Search"; }else{ cur_search_type = cur_search_type || 'all'; }
        var f = $jq("#" + box).val();
        if(f === "search..." || !f){
          f = "";
        }

        f = encodeURIComponent(f.trim());
        f = f.replace('%26', '&');
        f = f.replace('%2F', '/');

        location.href = '/search/' + cur_search_type + '/' + f + (cur_search_species_type ? '?species=' + cur_search_species_type : '');
    }

    function search_change(new_search) {
      if(!new_search) { new_search = 'gene';}
      cur_search_type = new_search;
      if(new_search === "all"){
      new_search = "for anything";
      }else{
        var search_for = "for a";
        if(new_search.match(/^[aeiou]/)){
          search_for = search_for + "n";
        }
        new_search = search_for + " " + new_search.replace(/[_]/, ' ');
      }

      $jq(".current-search").text(new_search);
    }


    function search_species_change(new_search) {
      cur_search_species_type = new_search;
      if(new_search === "all"){
      new_search = "all species";
      }else{
        new_search = new_search.charAt(0).toUpperCase() + new_search.slice(1);
        new_search = new_search.replace(/[_]/, '. ');
      }
      $jq(".current-species-search").text(new_search);
    }



  function checkSearch(div){
    var results = div.find("#results"),
        searchData = (results.size() > 0) ? results.data("search") : undefined;
    if(!searchData){ formatExpand(results); return; }
    SearchResult(searchData['query'], searchData["type"], searchData["species"], searchData["widget"], searchData["nostar"], searchData["count"], div);
  }

  function formatExpand(div){
      var expands = div.find(".text-min");
      for(var i=-1, el, l = expands.size(); ((el = expands.eq(++i)) && i < l);){
        if (el.height() > 35){
          el.html('<div class="text-min-expand">' + el.html() + '</div><div class="more"><div class="ui-icon ui-icon-triangle-1-s"></div></div>')
            .click(function(){
            var container = $jq(this),
                txt = container.children(".text-min-expand");
            txt.animate({height:(txt.height() < 40) ? '100%' : '2.4em'})
               .css("max-height", "none")
               .next().toggleClass('open').children()
               .toggleClass('ui-icon-triangle-1-s ui-icon-triangle-1-n');
            container.parent().find(".expand").toggleClass('ellipsis');
          });
        }
      }
  }

  function SearchResult(q, type, species, widget, nostar, t, container){
    var query = decodeURI(q),
        page = 1.0,
        total = t,
        resultDiv = container.find((widget ? "." + widget + "-widget " : '') + ".load-results"),
        queryList = query ? query.replace(/[,\.\*]|%22|%27/g, ' ').split(' ') : [];

    function init(){
      container.find("#results").find(".load-star").each(function(){
        $jq(this).load($jq(this).attr("href"));
      });
    }


    function formatResults(div){
      formatExpand(div);

      if(queryList.length === 0) { return; }
      Plugin.getPlugin("highlight", function(){
        for (var i=0; i<queryList.length; i++){
          if(queryList[i]) { div.highlight(queryList[i]); }
        }
      });
    }

    formatResults(container.find("div#results"));
    init();

    if(total > 10 || !total){
      if(container.find(".lazyload-widget").size() > 0){ Scrolling.search(); }
      resultDiv.click(function(){
        var url = $jq(this).attr("href") + (page + 1) + "?" + (species ? "species=" + species : '') + (widget ? "&widget=" + widget : '') + (nostar ? "&nostar=" + nostar : ''),
            div = $jq("<div></div>"),
            res = $jq((widget ? "." + widget + "-widget" : '') + " #load-results");

        $jq(this).removeClass("load-results");
        page++;

        setLoading(div);

        res.html("loading...");
        div.load(url, function(response, status, xhr) {
          total = div.find("#page-count").data("count") || total;
          var left = total - (page*10);
          if(left > 0){
            if(left>10){left=10;}
            res.addClass("load-results");
            res.html("load " + left + " more results");
          }else{
            res.remove();
          }

          formatResults(div);

          if (status === "error") {
            var msg = "Sorry but there was an error: ";
            $jq(this).html(msg + xhr.status + " " + xhr.statusText);
          }
          Scrolling.sidebarMove();

          div.find(".load-star").each(function(){
            $jq(this).load($jq(this).attr("href"));
          });
        });

        div.appendTo($jq(this).parent().children("ul"));
        loadcount++;
        Scrolling.sidebarMove();
      });
    }

  } //end SearchResult

  function loadResults(url){
    var allSearch = $jq("#all-search-results");
    allSearch.empty();
    ajaxGet(allSearch, url, undefined, function(){
      checkSearch(allSearch);
    });
    loadcount = 0;
    if(!allSearch.hasClass("references"))
      scrollToTop();
    return false;
  }

  function scrollToTop(){
    try{
      $jq(window).scrollTop(0);
    }catch(err){
    }
    Scrolling.resetSidebar();
    return undefined;
  }

  function allResults(type, species, query, widget){
    var url_search_base = "/search/" + type + "/" + query,
        url = url_search_base + "/1?inline=1" + (species && "&species=" + species),
        allSearch = $jq("#all-search-results"),
        searchSummary = $jq("#search-count-summary"),
        curr = $jq("#curr-ref-text");
    if(!widget){
      Scrolling.sidebarInit();
      search_change(type);
      ajaxGet(allSearch, url, undefined, function(){
        checkSearch(allSearch);

        var dl = searchSummary.find(".dl-search");
        var dl_button = dl.closest('li');

        dl.load(dl.attr("href"), function(){
          var resultCount = (parseInt(dl.text().replace(/K/g,'000').replace(/[MBGTP]/g, '000000').replace(/\D/g, ''), 10));
          if(resultCount < 100000){
            searchSummary.find("#get-breakdown").show().click(function(){
              setLoading($jq(this));
              searchFilter(searchSummary, curr);
              searchSummary.find(".ui-icon-close").click(function(){
                loadResults(url);
                searchSummary.find(".ui-selected").removeClass("ui-selected");
                return false;
              });
             });
          }
          if(resultCount < 500){
            // allows downloading search result if # is small
            searchSummary.find('.dl-format a').each(function(){
              var format = $jq(this).attr('data-content-type');
              var dl_params = $jq.param({'species': species,
                                         'format': format});
              var dl_url = url_search_base + "/all" +
                (dl_params && '?' + dl_params);
              $jq(this).attr('href',dl_url);
            });
          }else{
            searchSummary.find('.dl-format-list').html('<li  style="height:auto">Too many results to download. Please use our <a href="ftp://ftp.wormbase.org/pub/wormbase/" target="_blank">FTP</a> site.</li>');
            dl_button.addClass('fade');
            dl_button.find('.ui-icon').addClass('ui-state-disabled');
          }
          dl_button.show();  // show the download button otherwise hidden
        });
      });
    } else if (widget == 'references') {
        // give users the option to filter results by paper type
        searchFilter(searchSummary, curr);
    }

  }

  function searchFilter(searchSummary, curr){
      searchSummary.find(".count").each(function() {
        $jq(this).load($jq(this).attr("href"), function(){
          if($jq(this).text() === '0'){
            $jq(this).parent().remove();
          }else {
            $jq(this).parent().show().parent().prev(".title").show();
            searchSummary.find("#get-breakdown").remove();
          }
        });
      });

      searchSummary.find(".load-results").click(function(){
        var button = $jq(this);
        loadResults(button.attr("href"));
        searchSummary.find(".ui-selected:not('#current-ref')").removeClass("ui-selected");
        button.addClass("ui-selected");
        curr.html(button.html());
        return false;
      });
  }


  function recordOutboundLink(link, category, action) {
    // The following doesnt't work, _gat isn't assigned (in global namespace or anywhere)
    // try {
    //   var pageTracker=_gat._createTracker("UA-16257183-1");
    //   pageTracker._trackEvent(category, action);
    // }catch(err){}
  }


    function openWidget(widget_name, nav, content, column){
        var url     = nav.attr("href");

        content.closest("li").appendTo($jq("#widget-holder").children(column));
        var heightDefault = content.height();

        if(content.text().length < 4){
          addWidgetEffects(content.parent(".widget-container"));
          ajaxGet(content, url, undefined, function(){
            if ($jq('.multi-view-container').length){
              WB.multiViewInit();
            }
            //console.log([content.offset().top - scrollPos]);
            discreetLoad(content, heightDefault);
            Scrolling.sidebarMove();checkSearch(content);
            Layout.resize();
          });
        }
        moduleMin(content.prev().find(".module-min"), false, "maximize");
        nav.addClass("ui-selected");
        content.parents("li").addClass("visible");
        return false;
    }

    function openField(container, url, settings, callback){
      var heightDefault = container.children('.field').height();

      settings.success = function(data){
        var field = $jq('<div/>').html(data).hide();
        container.append(field);
        WB.tooltipInit();
        setTimeout(function(){
          // a long wait to ensure field is rendered before showing,
          // to avoid miscalculating field height
          container.children().first().remove();  //remove placeholder
          container.children().show();
          discreetLoad(container.children('.field'), heightDefault);
        },2000);
      };

      ajaxGet(container, url, settings);
      return false;
    }

    // when content is loaded asynchronously, its height may cause viewport to
    // shift position. So set page scroll position as needed
    function discreetLoad(container, heightDefault){
      var scrollPos = $jq(window).scrollTop();
      if (container.offset().top < scrollPos - 25){
        var heightIncrease = container.height() - heightDefault;

        $jq('html,body').stop(true,true).animate({
          scrollTop: scrollPos + heightIncrease
        }, 1);
      }
    }


    function minWidget(widget_name){
      moduleMin($jq("#" + widget_name).find(".module-min"), false, "minimize");
    }

    function reloadWidget(widget_name, noLoad, url){
        var con = $jq("#" + widget_name + "-content");
        if(con.text().length > 4)
          ajaxGet(con, url || $jq("#nav-" + widget_name).attr("href"), { noLoadImg: noLoad }, function(){ checkSearch(con); });
    }


  function addWidgetEffects(widget_container) {
      widget_container.find("div.module-min").hover(
        function () {
          var button = $jq(this);
          button.addClass((button.hasClass("show") ? "ui-icon-circle-triangle-e" : "ui-icon-circle-triangle-s"));
        },
        function () {
          var button = $jq(this);
          button.removeClass("ui-icon-circle-triangle-s ui-icon-circle-triangle-e").addClass((button.hasClass("show") ? "ui-icon-triangle-1-e" : "ui-icon-triangle-1-s"));
        }
      );

      widget_container.find("div.module-close").hover(
        function () {
          $jq(this).toggleClass("ui-icon-circle-close ui-icon-close");
        }
      );
  }


var Layout = (function(){
  var sColumns = false,
      ref = $jq("#references-content"),
      wHolder = $jq("#widget-holder"),
      title = $jq("#page-title").find("h2"),
      maxWidth = (location.pathname === '/' || location.pathname === '/me') ? 900 : 1300, //home page? allow narrower columns
    //get an ordered list of all the widgets as they appear in the sidebar.
    //only generate once, save for future
      widgetList = window.wl || (function() {
        var instance = this,
            navigation = $jq("#navigation"),
            list = navigation.find(".module-load")
                  .map(function() { return this.getAttribute("wname");})
                  .get();
        window.wl = { list: list };
        return window.wl;
        })();

    function resize(){
      if(sColumns !== (sColumns = (document.documentElement.clientWidth < maxWidth))){
        sColumns ? columns(100, 100) : readHash();
        var multCol = $jq("#column-dropdown").find(".multCol");
        if(multCol) multCol.toggleClass("ui-state-disabled");
      }
      if ((body.hasClass('table-columns')) && title.size() > 0 &&
        ((wHolder.children(".left").width() + wHolder.children(".right").width()) >
        (title.outerWidth())))
        columns(100, 100, 1);
      if(ref && (ref.hasClass("widget-narrow") !== (ref.innerWidth() < 845)))
        ref.toggleClass("widget-narrow");
    }

    function columns(leftWidth, rightWidth, noUpdate){
      var sortable = wHolder.children(".sortable"),
          tWidth = wHolder.innerWidth(),
          leftWidth = sColumns ? 100 : leftWidth;
      if(leftWidth>95){
        rightWidth = leftWidth = 100;
        body.removeClass('table-columns').addClass('one-column');
      }else{
        body.addClass('table-columns').removeClass('one-column');
      }
      sortable.filter(".left").css("width",leftWidth + "%");
      sortable.filter(".right").css("width",rightWidth + "%");

      if(!noUpdate){ updateLayout(); }
    }

    function deleteLayout(layout){
      var $class = wHolder.attr("wclass");
      $jq.get("/rest/layout/" + $class + "/" + layout + "?delete=1");
      $jq("div.columns ul div li#layout-" + layout).remove();
    }

    function setLayout(layout){
      var $class = wHolder.attr("wclass");
      $jq.get("/rest/layout/" + $class + "/" + layout, function(data) {
          var nodeList = data.childNodes[0].childNodes,
              len = nodeList.length;
          for(var i=0; i<len; i++){
            var node = nodeList.item(i);
            if(node.nodeName === "data"){
              location.hash = node.attributes.getNamedItem('lstring').nodeValue;
            }
          }
        }, "xml");
    }

    function resetPageLayout(layout){
      layout = layout || wHolder.data("layout");
      if(layout['hash']){
          location.hash = layout['hash'];
      }else{
          resetLayout(layout['leftlist'], layout['rightlist'] || [], layout['leftwidth'] || 100);
          reloadLayout++;
          updateLayout();
      }
    }


    function newLayout(layout){
      updateLayout(layout, undefined, function() {
        $jq(".list-layouts").load("/rest/layout_list/" + $jq(".list-layouts").data("class") + "?section=" + $jq(".list-layouts").data("section"), function(response, status, xhr) {
            if (status === "error") {
                var msg = "Sorry but there was an error: ";
                $jq(".list-layouts").html(ajaxError(xhr));
              }
            });
          });
      if(timer){
        clearTimeout(timer);
        timer = undefined;
      }
      timer = setTimeout(function() {
          $jq("#column-dropdown").children("ul").hide();
       }, 700)
      return false;
    }

    function updateURLHash (left, right, leftWidth, minimized, sidebar) {
      var l = $jq.map(left, function(i) { return getWidgetID(i);}),
          r = $jq.map(right, function(i) { return getWidgetID(i);}),
          m = $jq.map(minimized, function(i) { return getWidgetID(i);}),
          ret = l.join('') + "-" + r.join('') + "-" + (leftWidth/10) + (m.length > 0 ? "-" + m.join('') : "") + (sidebar ? "-" : "");
      if(location.hash && decodeURI(location.hash).match(/^[#](.*)$/)[1] !== ret){
        reloadLayout++;
      }
      location.hash = ret;
      return ret;
    }

    function readHash() {
      if(reloadLayout === 0){
        var hash = location.hash,
            arr,
            h = (arr = decodeURI(hash).match(/^[#](.*)$/)) ? arr[1].split('-') : undefined;
        if(!h){ return; }

        var l = h[0],
            r = h[1],
            w = (h[2] * 10),
            m = h[3],
            s = (hash.charAt(hash.length-1) === '-');

        if(l){ l = $jq.map(l.split(''), function(i) { return getWidgetName(i);}); }
        if(r){ r = $jq.map(r.split(''), function(i) { return getWidgetName(i);}); }
        if(m){ m = $jq.map(m.split(''), function(i) { return getWidgetName(i);}); }
        resetLayout(l,r,w,hash,m,s);
      }else{
        reloadLayout--;
      }
    }



    //returns order of widget in widget list in radix (base 36) 0-9a-z
    function getWidgetID (widget_name) {
        return widgetList.list.indexOf(widget_name).toString(36);
    }

    function openAllWidgets(){
      var hash = "",
          wlen = $jq("#navigation").find("li.module-load:not(.tools,.me,.toggle)").size();
      if(widgetList.list.length === 0){ return; }
      for(var i=0; i<wlen; i++){
        hash = hash + (i.toString(36));
      }
      window.location.hash = hash + "--10";
      return false;
    }

    //returns widget name
    function getWidgetName (widget_id) {
        return widgetList.list[parseInt(widget_id,36)];
    }

    function updateLayout(layout, hash, callback){
      var $class = wHolder.attr("wclass"),
          lstring = hash || readLayout(wHolder),
          l = ((typeof layout) === 'string') ? escape(layout) : 'default';
      $jq.post("/rest/layout/" + $class + "/" + l, { 'lstring':lstring }, function(){
      Layout.resize();
      if(callback){ callback(); }
      });
    }

    function readLayout(holder){
      var left = holder.children(".left").children(".visible")
                      .map(function() { return this.id;})
                      .get(),
          right = holder.children(".right").children(".visible")
                      .map(function() { return this.id;})
                      .get(),
          leftWidth = getLeftWidth(holder),
          minimized = holder.find(".visible .widget-container.minimized").parent()
                                .map(function() { return this.id;})
                      .get(),
          sidebar = $jq("#navigation").find(".closed").size() > 0 ? true : false;
      return updateURLHash(left, right, leftWidth, minimized, sidebar);
    }

    function getLeftWidth(holder){
      var leftWidth = sColumns ?  ((decodeURI(location.hash).match(/^[#](.*)$/)[1].split('-')[2]) * 10): (parseFloat(holder.children(".left").outerWidth())/(parseFloat(holder.outerWidth())))*100;
      return Math.round((isNaN(leftWidth) ? 100 : leftWidth)/10) * 10; //if you don't round, the slightest change causes an update
    }

    function resetLayout(leftList, rightList, leftWidth, hash, minimized, sidebar){
      $jq("#navigation").find(".ui-selected").removeClass("ui-selected");
      $jq("#widget-holder").children().children("li").removeClass("visible");

      columns(leftWidth, (100-leftWidth), 1);
      for(var widget = 0, l = leftList ? leftList.length : 0; widget < l; widget++){
        var widget_name = $jq.trim(leftList[widget]);
        if(widget_name.length > 0){
          var nav = $jq("#nav-" + widget_name),
              content = $jq("#" + widget_name + "-content");
          openWidget(widget_name, nav, content, ".left");
        }
      }
      for(var widget = 0, l = rightList ? rightList.length : 0; widget < l; widget++){
        var widget_name = $jq.trim(rightList[widget]);
        if(widget_name.length > 0){
          var nav = $jq("#nav-" + widget_name),
              content = $jq("#" + widget_name + "-content");
          openWidget(widget_name, nav, content, ".right");
        }
      }
      for(var widget = 0, l = minimized ? minimized.length : 0; widget < l; widget++){
        var widget_name = $jq.trim(minimized[widget]);
        if(widget_name.length > 0){
          minWidget(widget_name);
        }
      }
      if(sidebar){
        $jq("#nav-min").click();
      }
      if(location.hash.length > 0){
        updateLayout(undefined, hash);
      }
    }

  return {
      resize: resize,
      deleteLayout: deleteLayout,
      columns: columns,
      openAllWidgets: openAllWidgets,
      resetLayout: resetLayout,
      setLayout: setLayout,
      resetPageLayout: resetPageLayout,
      readHash: readHash,
      getLeftWidth: getLeftWidth,
      updateLayout: updateLayout,
      newLayout: newLayout
  }
})();



var Scrolling = (function(){
  var $window = $jq(window),
      system_message = 0,
      isStatic = 0,// 1 = sidebar fixed position top of page. 0 = sidebar in standard pos
      footerHeight = $jq("#footer").outerHeight(),
      sidebar,
      offset,
      widgetHolder,
      body = $jq('html,body'),
      scrollingDown = 0,
      count = 0, //semaphore
      titles;

  function resetSidebar(){
    isStatic = 0;
    sidebar.stop(false, true).css('position', 'relative').css('top', 0);
  }

  function goToAnchor(anchor){
      var elem = document.getElementById(anchor),
          scroll = isScrolledIntoView(elem) ? undefined : $jq(elem).offset().top - system_message - 10;
      if(scroll){
        body.stop(false, false).animate({
          scrollTop: scroll
        }, 300, 'easeInOutExpo', function(){
          scrollingDown = (body.scrollTop() < scroll) ? 1 : 0;
          Scrolling.sidebarMove();
        });
      }
  }

  function scrollUp(elem){
    var elemBottom = $jq(elem).offset().top + $jq(elem).height(),
        docViewBottom = $window.scrollTop() + $window.height();
    if((elemBottom <= docViewBottom) ){
      body.stop(false, true).animate({
          scrollTop: $window.scrollTop() - elem.height() - 10
      }, "fast", function(){ Scrolling.sidebarMove(); });
    }
  }

  function isScrolledIntoView(elem){
      var docViewTop = $window.scrollTop(),
          docViewBottom = docViewTop + ($window.height()*0.75),
          elemTop = $jq(elem).offset().top;
      return ((docViewTop <= elemTop) && (elemTop <= docViewBottom));
  }

  // Decide whether sidebar should be full height or flexible height.
  // With long sidebar, set sidebar height 100% to allow scroll on y-overflow.
  // With short side bar, allow flex height, so when scrolling the document to
  // near the footer, the sidebar isn't pushed off screen until it absolutely
  // cannot fit.
  // (There should be a better way to do it...)
  function sidebarFit() {
    var sidebarUl = sidebar.find('ul');

    // must be set to check overflow
    sidebar.css('height', $jq(window).height() - system_message);

    if (isStatic===1 && sidebarUl.prop('scrollHeight') > sidebarUl.height()){
      // allow only sticky sidebar to be scrollable, to avoid complications

      sidebarUl.css('overflow-y','scroll');
      $jq("#nav-more").show();
      sidebarScroll.updateScrollState();

      // Occasionally, count is stuck at 1 and not reset. Not sure how to fix
      // titles = $jq(sidebar.find(".ui-icon-triangle-1-s:not(.pcontent)"));
      // if(count===0 && titles.length){
      //   count++; //Add counting semaphore to lock
      //   //close lowest section. delay for animation.
      //   titles.last().parent().click().delay(250).queue(function(){ count--; Scrolling.sidebarFit();});
      // }
    }else{
      sidebar.css('height','initial');
      sidebarUl.css('overflow-y','hidden');
      $jq("#nav-more").hide();
    }
  }

  // add a scroll down button to sidebar,
  // to make it obvious overflow has occured.
  var sidebarScroll = (function(){
    var sidebarUl = $jq('#navigation ul');
    var sbScrlBttn = $jq("#nav-more");

    var loop = function(){
      sidebarUl.stop().animate({scrollTop: sidebarUl.scrollTop()+100}, 1000, 'linear', loop);
    };

    var stop = function(){
      sidebarUl.stop();
    };

    var updateScrollState = function(){
      if ( sidebarUl.scrollTop() < sidebarUl.prop("scrollHeight") - sidebarUl.height() - 5){
        // not near the bottom, allow of 5px "buffer"
        sbScrlBttn.removeClass('ui-state-disabled');
      }else{
        // scrolled near the bottom
        sbScrlBttn.addClass('ui-state-disabled');
      }
    };

    return {
      init: function(){
        sidebarUl.scroll(updateScrollState);
        sbScrlBttn.hover(loop, stop); // Loop-fn on mouseenter, stop-fn on mouseleave
      },
      updateScrollState: updateScrollState,
      reset: function() { sidebarUl.scrollTop(0); }
    };
  })();


  // affix sidebar
  function sidebarMove() {
      if(!sidebar)
        return;
      if(sidebar.offset()){
        var objSmallerThanWindow = (sidebar.outerHeight() < ($window.height() - system_message)) || (sidebar.find(".closed").size() > 0),
            scrollTop = $window.scrollTop(),
            maxScroll = $jq(document).height() - (sidebar.outerHeight() + footerHeight + system_message + 20); //the 20 is for padding before footer

        // console.log({
        //   scrollTop: scrollTop,
        //   maxScrool:maxScroll,
        //   offset: offset,
        //   isStatic:isStatic,
        //   count:count,
        //   objSmallerThanWindow: objSmallerThanWindow
        // });

        if(sidebar.outerHeight() > widgetHolder.height()){
            resetSidebar();
            return;
        }
          if(isStatic===0){
            if ((scrollTop >= offset) && (scrollTop <= maxScroll)){
                sidebar.stop(false, true).css('position', 'fixed').css('top', system_message);
                isStatic = 1;
            }else if(scrollTop > maxScroll){
                sidebar.stop(false, true).css('position', 'fixed').css('top', system_message - (scrollTop - maxScroll));
                //isStatic = 1;
            }else{
                //resetSidebar();
            }
          }else{
            if (scrollTop < offset) {
                resetSidebar();
                sidebarScroll.reset();
            }else if(scrollTop > maxScroll){
                sidebar.stop(false, true).css('position', 'fixed').css('top', system_message - (scrollTop - maxScroll));
                isStatic = 0;
                if(scrollingDown === 1){body.stop(false, true); scrollingDown = 0; }
            }else{
              // needed to re-position sidebar after close system message
              sidebar.stop(false, true).css('position', 'fixed').css('top', system_message);
            }
          }
      }
      Scrolling.sidebarFit();
    }

  function sidebarInit(){
    sidebar   = $jq("#navigation");
    offset = sidebar.offset().top;
    widgetHolder = $jq("#widget-holder");

    var sidebarUl = sidebar.find('ul');

    sidebarScroll.init();  // allow side content to be scrolled
    sidebarFit();

    $window.scroll(function() {
      Scrolling.sidebarMove();
    });

    // prevent document being scrolled along when scrolling sidebar
    var bdy = $jq('body');
    sidebar.mouseover(function(){
      if (sidebarUl.css('overflow-y') === 'scroll'){
        bdy.addClass('noscroll');
      }

    }).mouseleave(function(){
      bdy.removeClass('noscroll');
    });
  }


  var search = function searchInit(){
      if(loadcount >= 6){ return; }
      $window.scroll(function() {
        var results    = $jq("#results");
        if(results.offset() && loadcount < 6){
          var rHeight = results.height() + results.offset().top;
          var rBottomPos = rHeight - ($window.height() + $window.scrollTop())
          if(rBottomPos < 400) {
            results.children(".load-results").trigger('click');
          }
        }
      });
    };

  function set_system_message(val){
    system_message = val;
  }

  return {
    sidebarInit:sidebarInit,
    search:search,
    set_system_message:set_system_message,
    sidebarMove: sidebarMove,
    sidebarFit: sidebarFit,
    resetSidebar:resetSidebar,
    goToAnchor: goToAnchor,
    scrollUp: scrollUp
  }
})();

    if(!Array.indexOf){
        Array.prototype.indexOf = function(obj){
            for(var i=0; i<this.length; i++){
                if(this[i]===obj){
                    return i;
                }
            }
            return -1;
        }
    }


  function updateCounts(url){
    var comments = $jq(".comment-count");
    if(comments.size() > 0)
      comments.load("/rest/feed/comment?count=1;url=" + url);
  }


  function validate_fields(email,username, password, confirm_password, wbemail){
      if( (email.val() ==="") && (!wbemail || wbemail.val() === "")){
                email.focus().addClass("ui-state-error");
                email.closest('#issues-new').find(".anon").removeClass("anon");
                return false;
      } else if( email.val() && (validate_email(email.val(),"Not a valid email address!")===false)) {
                email.focus().addClass("ui-state-error");
                email.closest('#issues-new').find(".anon").removeClass("anon");
                return false;
      } else if(password) {
          if( password.val() ===""){
                password.focus().addClass("ui-state-error");return false;
          } else if( confirm_password && (password.val() !== confirm_password.val())) {
              alert("The passwords do not match. Please enter again"); password.focus().addClass("ui-state-error");return false;
          }
      } else if( username && username.val() ==="") {
                username.focus().addClass("ui-state-error"); return false;
      }  else {
        return true;
      }
  }

  function validate_email(field,alerttxt){
    var apos=field.indexOf("@"),
        dotpos=field.lastIndexOf(".");
    if (apos<1||dotpos-apos<2)
      {alert(alerttxt);return false;}
    else {return true;}
  }


  var comment = {
    init: function(pageInfo){
      comment.url = pageInfo['ref'];
    },
    submit: function(cm){
        var feed = cm.closest('#comment-new'),
            content = feed.find(".comment-content").val();
        if(content === "" || content === "write a comment..."){
            feed.find(".comment-content").focus();
            return false;
        }
        $jq.ajax({
          type: 'POST',
          url: '/rest/feed/comment',
          data: { content: content, url: comment.url},
          success: function(data){
            displayNotification("Comment Submitted!");
            feed.find("#comment-box").prepend(data);
            feed.find(".comment-content").val("write a comment...");
            updateCounts(comment.url);
              },
          error: function(xhr,status,error) {
                $jq("#comments").prepend(ajaxError(xhr));
              }
        });
        var box = $jq('<div class="comment-box"><a href="/me">' + name + '</a> ' + content + '<br /><span id="fade">just now</span></div>');
        var comments = $jq("#comments");
        comments.prepend(box);
        return false;
    },
    cmDelete: function(cm){
       var $id=cm.attr("id"),
           url= cm.attr("rel");

      $jq.ajax({
        type: "POST",
        url : url,
        data: {method:"delete",id:$id},
        success: function(data){
                      updateCounts(url);
          },
        error: function(xhr,status,error) {
                $jq("#comments").prepend(ajaxError(xhr));
            cm.innerHTML(error);
          }
      });
      cm.parent().remove();
    }

  }


  var issue = {
    init: function(pageInfo){
      issue.url = pageInfo['ref'];
    },
   submit:function(is){
        var rel= is.attr("rel"),
            url = is.attr("url"),
            page = is.attr("page"),
            feed = is.closest('#issues-new'),
            container = feed.parent(),
            message = container.find("#issue-message"),
            addNewLink = container.find("#add-new-issue"),
            name = feed.find("#name"),
            dc = feed.find("#desc-content"),
            email = feed.find("#email"),
            //anon = feed.find("#anon").is(':checked'),
            content = feed.find("#issue-content");

        if (!validate_fields(email))
          return;
        if(!content){
          feed.find("#issue-content").focus();
          return;
        }

       //prepare content from either
       // user entered question/feedback, OR
       // copied html error report through "Let us know" OR
       // pre-generated html report, ie in status/error.tt2
       content = $jq('<textarea/>').html(content.val()).val()  //convert encoded html error report to html
           || content.html();
       content = content.replace(/^\s+/mg, ''); // avoid problematic leading spaces for github
       content = content.replace(/^\n+|\n+$/, ''); // remove leading and trailing empty lines

       if(content.match(/^\<(div)|(p)\>.*/)){
           content.replace(/\n/g, '');
       }else{
           content = content.replace(/\n+/g, '<br/>');
           content = '<p>&nbsp;&nbsp;' + content + '</p>';
       }

       content += (dc && $jq.trim(dc.val())  ? '<p>What were you doing? <br />&nbsp;&nbsp;' + dc.val() + '</p>': '');

        $jq.ajax({
          type: 'POST',
          url: rel,
          dataType: 'json',
          data: {title:feed.find("#issue-title option:selected").val(),
                content: content,
                name: name.val(),
                email: email.val(),
                url: url || issue.url,
                page: page,
                hash: location.hash,
                userAgent: window.navigator.userAgent},
          success: function(data){
                  message.append(data.message);
              },
          error: function(xhr,status,error) {
                  message.append(ajaxError(xhr));
              }
        });
        feed.children().not('#issue-message').hide();
        addNewLink.show();
        message.append("<p><h2 style='color:rgb(95, 112, 137);'>Thank you for helping WormBase!</h2></p><p>The WormBase helpdesk will get back to you shortly. You will recieve an email confirmation momentarily. Please email <a href='mailto:help\@wormbase.org'>help\@wormbase.org</a> if you have any concerns.</p>");
        return false;
   },

   addNewIssue: function(link){
        var issue = link.closest('#issue-box-content').find('#issues-new');
        issue.children().not('.anon').show();
        issue.find('#issue-message').children().remove();
        issue.find("input[type=text], textarea").val("");
        link.closest('#add-new-issue').hide();
   },
  }


  var StaticWidgets = {
    update: function(widget_id, path){
        if(!widget_id){ widget_id = "0"; }
        var widget = $jq("li#static-widget-" + widget_id),
            widget_title = widget.find("input#widget_title").val(),
            widget_order = widget.find("input#widget-order").val(),
            widget_content = widget.find("textarea#widget_content").val();

        $jq.ajax({
              type: "POST",
              url: "/rest/widget/static/" + widget_id,
              dataType: 'json',
              data: {widget_title:widget_title, path:path, widget_content:widget_content, widget_order:widget_order},
              success: function(data){
                    StaticWidgets.reload(widget_id, 0, data.widget_id);
                },
              error: function(xhr,status,error) {
                widget.find(".content").html(ajaxError(xhr));
                }
          });
    },
    edit: function(wname, rev) {
      var widget_id = wname.split("-").pop(),
          w_content = $jq("#" + wname + "-content"),
          widget = w_content.parent(),
          edit_button = widget.find("a#edit-button");
      if(edit_button.hasClass("ui-state-highlight")){
        StaticWidgets.reload(widget_id);
      }else{
        edit_button.addClass("ui-state-highlight");
        w_content.load("/rest/widget/static/" + widget_id + "?edit=1");
      }

    },
    reload: function(widget_id, rev_id, content_id){
      var w_content = $jq("#static-widget-" + widget_id + "-content"),
          widget = w_content.parent(),
          title = widget.find("h3 span.widget-title input"),
          url = "/rest/widget/static/" + (content_id || widget_id);
      if(title.size()>0){
        title.parent().html(title.val());
      }
      widget.find("a.button").removeClass("ui-state-highlight");
      $jq("#nav-static-widget-" + widget_id).text(title.val());
      if(rev_id) { url = url + "?rev=" + rev_id; }
      w_content.load(url);
    },
    delete_widget: function(widget_id){
      if(confirm("are you sure you want to delete this widget?")){
        $jq.ajax({
          type: "POST",
          url: "/rest/widget/static/" + widget_id + "?delete=1",
          success: function(data){
            $jq("#nav-static-widget-" + widget_id).click().hide();
          },
          error: function(xhr,status,error) {
              $jq("li#static-widget-" + widget_id).find(".content").html(ajaxError(xhr));
          }
        });
      }
    },
    history: function(wname){
      var widget = $jq("#" + wname),
         history = widget.find("div#" + wname + "-history");
      if(history.size() > 0){
        history.toggle();
        widget.find("a#history-button").toggleClass("ui-state-highlight");
      }else{
        var widget_id = wname.split("-").pop(),
            history = $jq('<div id="' + wname + '-history"></div>');
        history.load("/rest/widget/static/" + widget_id + "?history=1");
        widget.find("div.content").append(history);
        widget.find("a#history-button").addClass("ui-state-highlight");
      }
    }
  }


  function historyOn(action, value, callback){
    if(action === 'get'){
        Plugin.getPlugin("colorbox", function(){
            $jq(".history-logging").colorbox();
            if(callback) callback();
        });
    }else{
      $jq.post("/rest/history", { 'history_on': value }, function(){
        histUpdate(value == 1 ? 1 : undefined);
        if(callback) callback(); });
      if($jq.colorbox) $jq.colorbox.close();
      $jq(".user-history").add("#user_history-content").html("<div><span id='fade'>Please wait, updating your history preferences</span></div>");
    }
  }

  function loadRSS(id, url){

    var container = $jq("#" + id);
    setLoading(container);
    $jq.get(url, function(xml){
      var entries = $jq(xml).find("item");
      var entriesHtml = $jq.makeArray(entries).slice(0,3).map(
        function(entry){
          var title = $jq(entry).find('title').text();
          var link = $jq(entry).find('link').text();
          var date = ($jq(entry).find('pubDate').text() || '').substring(0, 16);
          var content = $jq(entry).find('content\\:encoded').text()
            || $jq(entry).find('description').text();
          content = content.replace(/(\<\/?p\>|\<br\>)/g, '')

          return [
            '<div class="result">',
            '<li>',
            '<div class="date" id="fade">' + date + '</div>',
            '<a href="' + link + '">' + title + '</a>',
            '</li>',
            '<div class="text-min">' + content + '</div></div>'
          ].join('');

        });

      var txt = [].concat(
        '<div id="results"><ul>',
        entriesHtml,
        '</ul></div>').join('');
      container.html(txt);
      formatExpand(container);
    });
  }




  var providers_large = {
      google: {
          name: 'Google',
          url: 'https://www.google.com/accounts/o8/id'
      },
      facebook: {
          name: 'Facebook',
          url:  'http://facebook.anyopenid.com/'
      }
  };

  var providers = $jq.extend({}, providers_large);

  var openid = {
      signin: function(box_id, onload) {
        var provider = providers[box_id];
        if (! provider) {
            return;
        }
        var pop_url = '/auth/popup?id='+box_id + '&url=' + provider['url']  + '&redirect=' + location;
        this.popupWin(pop_url);

        //if on wormmine page, try sign in to wormmine,
        // currently not enable for entire site due to redirect issue
        if (window.location.href.indexOf("tools/wormmine") > -1){
          this.signinWormMine(box_id);
        }
      },

      popupWin: function(url) {
        // var h = 400;
        // var w = 600;
        // var screenx = (screen.width/2) - (w/2 );
        // var screeny = (screen.height/2) - (h/2);

        // var win2 = window.open(url,"popup","status=no,resizable=yes,height="+h+",width="+w+",left=" + screenx + ",top=" + screeny + ",toolbar=no,menubar=no,scrollbars=no,location=no,directories=no");
        // win2.focus();
        window.location = url;
      },

     signinWormMine: function(provider){
       var mineProviders = {
         google: 'Google'
       };
       var mineUrlBase = 'https://www.wormbase.org/tools/wormmine/openid?provider=%s';
       var mineUrl;
       if (mineProviders[provider]){
         mineUrl = mineUrlBase.replace('%s', mineProviders[provider]);
      //   $jq.get(mineUrl);
         window.location.replace(mineUrl);
       }
     }
  };

    function multiViewInit(){
      Plugin.getPlugin('icheck',function(){
        var buttons = $jq('.multi-view-container input:radio');
        buttons.iCheck({
          radioClass: 'iradio_square-aero'
        }).on('ifChecked', function(){
          var viewId = $jq(this).attr('value');
          var container = $jq(this).closest('.multi-view-container');
          container.find('.multi-view').hide();
          container.find('#'+viewId).show();
        });

      });
    }

    function partitioned_table(group_by_col, row_summarize){

      var drawCallback = function( settings ){
            var api = this.api();
            var rows = api.rows().nodes();
            var last=null;

            api.column(0).nodes().each( function ( cell, i ) {
                $jq(cell).children().hide();
                $jq(cell).text('');
            });

            api.rows().data().each( function ( rowData, i ) {

                var groupID = rowData[0];
                var group = rowData[group_by_col];
                // var group = $jq(cell).find(".go_term-link").text();
                // var extensions = $jq(cell).children("> :not(.evidence)").hide();
                if ( last !== group ) {

                    var summary_row = row_summarize ? row_summarize(rowData)
                      : '<td>' + group + '</td>';
                    $jq(rows).eq( i ).before(
                        '<tr class="group">' + summary_row + '<td colspan="100%"></td></tr>'
                    );

                    last = group;
                }
              //  $jq(cell).html(extensions);
            } );

      };
      return drawCallback;
    }


    function getMarkItUp(callback){
      Plugin.getPlugin("markitup", function(){
        Plugin.getPlugin("markitup-wiki", callback);
      });
      return;
    }



    var initJbrowseView = function(elementSelector, url) {
      function reset() {
        $jq(elementSelector).find('iframe').attr('src', url);
      }
      return reset;
    };

    return{
      // initiate page
      init: init,                                   // initiate all js on any wormbase page

      // searching
      search: search,                               // run search using current filters
      search_change: search_change,                 // change the class search filter
      search_species_change: search_species_change, // change the species search filter
      checkSearch: checkSearch,                     // check search results - post-format if needed
      allResults: allResults,                       // setup search all page
      formatExpand: formatExpand,                   // expandable div between text-min class

      // static widgets
      getMarkItUp: getMarkItUp,                     // get markup plugin for static widgets
      StaticWidgets: StaticWidgets,                 // modify static widgets (edit/update)

      // layouts
      deleteLayout: Layout.deleteLayout,            // delete saved layout
      columns: Layout.columns,                      // get column configuration from layout
      setLayout: Layout.setLayout,                  // save current layout as a saved layout
      resetPageLayout: Layout.resetPageLayout,      // reset page to default widget layout
      resetLayout: Layout.resetLayout,              // apply page layout
      openAllWidgets: Layout.openAllWidgets,        // open all widgets on the page
      newLayout: Layout.newLayout,                  // create a new layout
      resize: Layout.resize,                        // resize the page

      // scrolling
      goToAnchor: Scrolling.goToAnchor,             // Scroll page to certain anchor
      scrollToTop: scrollToTop,                     // scroll to the top of the page

      // loading - ajax/plugins/files/RSS
      ajaxGet: ajaxGet,                             // load data via ajax request
      setLoading: setLoading,                       // add the loading image to a certain div
      openField: openField,                         // load field with discreetLoad

      loadRSS: loadRSS,                             // load RSS (homepage)
      getPlugin: Plugin.getPlugin,                  // load plugin

      // notifications
      displayNotification: displayNotification,     // display notification at the top of the page

      // user session, comments/issues
      openid: openid,                               // login via openid
      historyOn: historyOn,                         // turn on history
      comment: comment,                             // add comment to a page
      issue: issue,                                 // submit an issue

      // miscellaneous
      validate_fields: validate_fields,             // validate form fields
      recordOutboundLink: recordOutboundLink,       // record external links
      setupCytoscapePersonLineage: setupCytoscapePersonLineage,       // setup cytoscape for use by PersonLineage
      setupCytoscapeInteraction: setupCytoscapeInteraction,           // setup cytoscape for use by Interaction
      setupCytoscapePhenGraph: setupCytoscapePhenGraph,               // setup cytoscape for use by Phenotype Graph
      FpkmPlots: FpkmPlots,                         // fpkm by life stage plots
      reloadWidget: reloadWidget,                   // reload a widget
      multiViewInit: multiViewInit,                 // toggle between summary/full view table
      partitioned_table: partitioned_table,         // augment to a datatable setting, when table rows are partitioned by certain attributes
      tooltipInit: tooltipInit,                     // initalize tooltip
      initJbrowseView: initJbrowseView              // initialize jbrowse view iframe to specified src
    };
  })();




  $jq(document).ready(function() {
      $jq.ajaxSetup( {timeout: 12e4 }); //2 minute timeout on ajax requests

      if(!window.$jq){
        WB.init();
        window.$jq = $jq;
      }
  });

  $jq(window).bind('beforeunload', function(){
    // scroll top upon page refresh
    WB.scrollToTop();
  });

  window.WB = WB;
}(window,document);



// Polyfills

if(typeof String.prototype.trim !== 'function') {
  String.prototype.trim = function() {
    return this.replace(/^\s+|\s+$/g, '');
  }
}

if(!Object.keys) Object.keys = function(o){
   if (o !== Object(o))
      throw new TypeError('Object.keys called on non-object');
   var ret=[],p;
   for(p in o) if(Object.prototype.hasOwnProperty.call(o,p)) ret.push(p);
   return ret;
}

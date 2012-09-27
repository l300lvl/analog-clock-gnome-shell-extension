const Lang = imports.lang;
const Mainloop = imports.mainloop;
const Cairo = imports.cairo;
const Clutter = imports.gi.Clutter;
const St = imports.gi.St;
const Gettext = imports.gettext.domain('gnome-shell');
const _ = Gettext.gettext;

const Config = imports.misc.config;
const Main = imports.ui.main;
const DateMenu = imports.ui.dateMenu;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Calendar = imports.ui.calendar;

function Clock () {
  this._init();
}

Clock.prototype = {
  _init: function() {
    this.values = [];
    this.values.push({color: "-clock-color", values: []});
    this.values.push({color: "-hours-color", values: []});
    this.values.push({color: "-mins-color", values: []});
    this.now = new Date();

    this.actor = new St.DrawingArea({style_class: 'clock-area', reactive: true});
    this.repaint = this.actor.connect("repaint", Lang.bind(this, this._draw));

    Mainloop.timeout_add_seconds(1, Lang.bind(this, function () {
      this.now = new Date();
      this.actor.queue_repaint();
      return true;
    }));
  },

  _draw: function(area) {
    let sec = this.now.getSeconds();
    let min = this.now.getMinutes();
    let hour = this.now.getHours();
    let [width, height] = area.get_surface_size();
    let themeNode = this.actor.get_theme_node();
    let cr = area.get_context();

    //draw clock
    let color = themeNode.get_color(this.values[0].color);
    Clutter.cairo_set_source_color(cr, color);
    
    cr.translate(Math.floor(width/2), Math.floor(height/2));   
    cr.save();
 
    cr.arc(0,0, Math.floor(height/2) - 2, 0, 7);
    cr.setLineWidth(2.5);
    cr.stroke();
    
    //hour hand
    color = themeNode.get_color(this.values[1].color);
    Clutter.cairo_set_source_color(cr, color);
    cr.setLineWidth(2.2);

    cr.rotate( (hour + sec/3600 + min/60) * Math.PI/6 + Math.PI);
    
    cr.moveTo(0,0);
    cr.lineTo(0, Math.floor(height/2)-3);
    cr.stroke();

    cr.restore();

    // minute hand
    color = themeNode.get_color(this.values[2].color);
    Clutter.cairo_set_source_color(cr, color);
    cr.setLineWidth(1.6);

    cr.rotate( (min+sec/60) * Math.PI/30 + Math.PI);
    
    cr.moveTo(0,0);
    cr.lineTo(0, Math.floor(height/2)-1);
    cr.stroke();

    cr.save();
    cr.restore();
  }
};

function ClockButton() {
  this._init.apply(this, arguments);
}

ClockButton.prototype = {
  __proto__: PanelMenu.Button.prototype,

  _init: function() {

    PanelMenu.Button.prototype._init.call(this, 0.5);

    if (age=="old") this.date_menu = Main.panel._dateMenu
    else            this.date_menu = Main.panel.statusArea.dateMenu

//    this.date_menu = Main.panel._dateMenu;
    this.orig_clock = this.date_menu._clock;
//    this.timeout = null;
    this._clockButton = new St.BoxLayout();
    this._clockIconBox = new St.BoxLayout({ style_class: 'clock-status-icon' });

    let clock = new St.BoxLayout({ style_class: 'clock-status-icon' });
    clock.add((new Clock()).actor);

    this._clockIconBox.add_actor(clock);
    this._clockButton.add_actor(this._clockIconBox);
    this.actor.add_actor(this._clockButton);
    
  },

    enable: function() {
        this.date_menu.actor.remove_actor(this.orig_clock);
        this.date_menu.actor.add_actor(this.actor);
//        Main.panel._centerBox.insert_child_at_index(this.actor, 0);
    },
    
    disable: function() {
//        Main.panel._centerBox.remove_actor(this.actor);
//        MainLoop.source_remove(this.timeout);

        this.date_menu.actor.remove_actor(this.actor);
        this.date_menu.actor.add_actor(this.orig_clock);
    }

};

let age;

function init(metadata) {
    let current_version = Config.PACKAGE_VERSION.split('.')
    if (current_version.length != 3 || current_version[0] != 3) throw new Error("Strange version number (extension.js:8).")
    
    switch (current_version[1]) {
        case"2": global.log("Warning of extension [" + metadata.uuid + "]:\n              Old development release detected (" + Config.PACKAGE_VERSION + "). You should upgrade!\n")   //eak
        case"3":
        case"4": age = "old"
            break
        case"5": global.log("Warning of extension [" + metadata.uuid + "]:\n              Development release detected (" + Config.PACKAGE_VERSION + "). Loading as a 3.6 release.\n") //eak
        case"6": age = "new"
            break
        default: throw new Error("Strange version number (extension.js:18).")
    }

  return new ClockButton();
}

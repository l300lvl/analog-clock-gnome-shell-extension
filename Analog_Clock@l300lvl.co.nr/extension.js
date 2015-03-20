
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const Cairo = imports.cairo;
const Clutter = imports.gi.Clutter;
const St = imports.gi.St;
const Gettext = imports.gettext.domain('analog-clock');
const _ = Gettext.gettext;

const Config = imports.misc.config;
const Main = imports.ui.main;
const DateMenu = imports.ui.dateMenu;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Calendar = imports.ui.calendar;

//let dummyActor;

function Clock () {
    this._init();
}

Clock.prototype = {
    _init: function() {
        this.values = [];
        this.values.push({color: "-clock-color", values: []});
        this.values.push({color: "-hours-color", values: []});
        this.values.push({color: "-mins-color", values: []});
        this.values.push({color: "-secs-color", values: []});
        this.now = new Date();

        this.actor = new St.DrawingArea({style_class: 'clock-area', reactive: true});
        this.repaint = this.actor.connect("repaint", Lang.bind(this, this._draw));

        this._timeoutID = Mainloop.timeout_add_seconds(1, Lang.bind(this, function () {
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
        cr.setLineWidth(2.3);
        cr.stroke();
    
        //hour hand
        color = themeNode.get_color(this.values[1].color);
        Clutter.cairo_set_source_color(cr, color);
        cr.setLineWidth(2.4);

        cr.rotate( (hour + sec/3600 + min/60) * Math.PI/6 + Math.PI);
    
        cr.moveTo(0,0);
        cr.lineTo(0, Math.floor(height/2)-3);
        cr.stroke();

        cr.restore();

        // minute hand
        color = themeNode.get_color(this.values[2].color);
        Clutter.cairo_set_source_color(cr, color);
        cr.setLineWidth(2.1);

        cr.rotate( (min+sec/60) * Math.PI/30 + Math.PI);
    
        cr.moveTo(0,0);
        cr.lineTo(0, Math.floor(height/2)-1);
        cr.stroke();

        cr.save();
        cr.restore();

        // second hand
        color = themeNode.get_color(this.values[3].color);
        Clutter.cairo_set_source_color(cr, color);
        cr.setLineWidth(1.8);

        //    cr.rotate( (sec/60) * Math.PI/30 + Math.PI);
        cr.rotate( (360/60) * (sec+45) * (3.141593/180))
        //    cr.rotate( ( 45 + sec + msec / 1000000.0 ) * 3.141593 / 30 )
        cr.moveTo(0,0);
        cr.lineTo(0, Math.floor(height/2)-1.5);
        cr.stroke();

        cr.save();
        cr.restore();
    },

        // @@ add a method destroy() that makes sure this class cleans up after
        // itself, i.e. disconnect the Mainloop.timeout_add_seconds
    destroy: function () {
        Mainloop.source_remove(this._timeoutID);
    }
};

function ClockButton() {
    this._init.apply(this, arguments);
}

ClockButton.prototype = {
    __proto__: PanelMenu.Button.prototype,

    _init: function() {
        PanelMenu.Button.prototype._init.call(this, 0.5);

        this.date_menu = Main.panel.statusArea.dateMenu

        this.orig_clock = this.date_menu._clockDisplay;
    },

    enable: function() {
        this._clockButton = new St.BoxLayout({ style_class: 'clock-status-icon' });
        let clock = new St.BoxLayout({ style_class: 'clock-status-icon' });
//    clock.add((new Clock()).actor);
        this._clock = new Clock();
        clock.add(this._clock.actor);

        this._clockButton.add_actor(clock);
        this.actor.add_actor(this._clockButton);
//        this.date_menu.actor.reparent(Main.panel._rightBox);
        this.date_menu.actor.remove_actor(this.orig_clock);
        this._clockButton.reparent(this.date_menu.actor);
    },
    
    disable: function() {
        this._clock.destroy();
        this.date_menu.actor.remove_actor(this._clockButton);
        this.date_menu.actor.add_actor(this.orig_clock);
    }

};

function init(metadata) {
    return new ClockButton();
}

const Lang = imports.lang;
const Mainloop = imports.mainloop;
const Cairo = imports.cairo;
const Clutter = imports.gi.Clutter;
const St = imports.gi.St;
const Gettext = imports.gettext.domain('gnome-shell');
const _ = Gettext.gettext;

const Main = imports.ui.main;
const DateMenu = imports.ui.dateMenu;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Calendar = imports.ui.calendar;

const HIDE_CLOCK = false; //true to hide normal clock, false to show this clock and the normal clock
const TOP_BOX = 'center2'; //options are left, right, center, center2, left or right keeps normal clock in center unless you hidden above

/* STOP! */
/* No Editing Below This Line!!!! */

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

    event = Mainloop.timeout_add_seconds(1, Lang.bind(this, function () {
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

    cr.restore();
  }
};

function ClockButton() {
  this._init.apply(this, arguments);
}

ClockButton.prototype = {
  __proto__: PanelMenu.Button.prototype,

  _init: function() {
    let item;
    let box;
    this.orgDateMenu = Main.panel._dateMenu;
    this._eventSource = new Calendar.DBusEventSource();

    PanelMenu.Button.prototype._init.call(this, 0.5);

    box = new St.BoxLayout({vertical: true});
    this.menu.addActor(box);

    // Date and Time
    this._date = new St.Label();
    this._date.style_class = 'datemenu-date-label';
    box.add(this._date);

    // Calendar
    this._calendar = new Calendar.Calendar(this._eventSource);

    box.add(this._calendar.actor);
    this._calendar._update(true);

    this._itemSeparator = new PopupMenu.PopupSeparatorMenuItem();
    box.add(this._itemSeparator.actor);
    this.menu.addSettingsAction(_("Date and Time Settings"), 'gnome-datetime-panel.desktop');

    this.menu.connect('open-state-changed', 
                      Lang.bind(this, function(menu, isOpen) {
                          if (isOpen) {
                              let now = new Date();
                              this._calendar.setDate(now, true);
                              }
                      }));

    this._updateMenu();

    this._clockButton = new St.BoxLayout();
    this._clockIconBox = new St.BoxLayout({ style_class: 'clock-status-icon' });

    let clock = new St.BoxLayout({ style_class: 'clock-status-icon' });
    clock.add((new Clock()).actor);

    this._clockIconBox.add_actor(clock);
    this._clockButton.add_actor(this._clockIconBox);
    this.actor.add_actor(this._clockButton);
    
  },
  
 _updateMenu: function() {
        let dateFormat;
        let displayDate = new Date();

        dateFormat = _("%A %B %e, %l:%M %p");
        this._date.set_text(displayDate.toLocaleFormat(dateFormat));

        Mainloop.timeout_add_seconds(1, Lang.bind(this, this._updateMenu));
        return false;
    },

    enable: function() {
        let hideclock = HIDE_CLOCK;
        let position = TOP_BOX;
                    if (hideclock == 'true') {
        Main.panel._dateMenu.actor.hide();
                    }
                    if (position == 'left') {
        let _children = Main.panel._leftBox.get_children();
        Main.panel._leftBox.insert_child_at_index(this.actor, _children.length - 1);
        Main.panel._menus.addMenu(this.menu);
                    } else if (position == 'right') {
        let _children = Main.panel._rightBox.get_children();
        Main.panel._rightBox.insert_child_at_index(this.actor, _children.length - 1);
        Main.panel._menus.addMenu(this.menu);
                    } else if (position == 'center') {
        Main.panel._centerBox.insert_child_at_index(this.actor, 0);
        Main.panel._menus.addMenu(this.menu);
                    } else if (position == 'center2') {
        Main.panel._centerBox.insert_child_at_index(this.actor, 1);
        Main.panel._menus.addMenu(this.menu);
                    }
    },
    
    disable: function() {
        Mainloop.source_remove(event);
        let hideclock = HIDE_CLOCK;
        let position = TOP_BOX;
                    if (hideclock == 'true') {
        Main.panel._dateMenu.actor.show();
                    }
                    if (position == 'left') {
        Main.panel._leftBox.remove_actor(this.actor);
                    } else if (position == 'right') {
        Main.panel._rightBox.remove_actor(this.actor);
                    } else if (position == 'center') {
        Main.panel._centerBox.remove_actor(this.actor);
                    } else if (position == 'center2') {
        Main.panel._centerBox.remove_actor(this.actor);
                    }
    }

};

function init() {
  return new ClockButton();
}

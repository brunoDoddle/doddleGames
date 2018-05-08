function ClassB4w() {
    var m_app = b4w.require("app");
    var m_logic_nodes = b4w.require("logic_nodes");
    var m_version = b4w.require("version");
    var m_data = b4w.require("data");
    var m_cfg = b4w.require("config");
    var m_ctl = b4w.require("controls");
    var m_scs = b4w.require("scenes");
    var m_phy = b4w.require("physics");
    var m_cons = b4w.require("constraints");
    var m_mouse = b4w.require("mouse");
    var m_cont = b4w.require("container");

    var right_arrow, left_arrow, up_arrow, down_arrow;

    var ROT_SPEED = 2;
    var CAMERA_OFFSET = new Float32Array([0, -8, 1.5]);
    var _character;

    var DEBUG = (m_version.type() === "DEBUG");

    //if (DODDLE.commons.testPhone())
    var quality = m_cfg.P_LOW;
    //else
    //var quality = m_cfg.P_HIGH;

    /*export*/
    function init() {
        m_app.init({
            canvas_container_id: "canvas_container",
            callback: init_cb,
            show_fps: true,
            autoresize: true,
            assets_dds_available: !DEBUG,
            assets_min50_available: !DEBUG,
            console_verbose: false,
            report_init_failure: true
        });
    }

    function init_cb(canvas_elem, success) {

        if (!success) {
            console.log("b4w init failure");
            return;
        }
        // Rend test available appelable dans les nodes blender
        //m_logic_nodes.append_custom_callback("test", test);
        load();
    }

    function load() {
        m_data.load("json/test.json", load_cb);
    }

    function load_cb(data_id) {
        $("#block").hide();
        console.log("load ok");
        //var cont = m_cont.get_container();

        right_arrow = m_ctl.create_custom_sensor(0);
        left_arrow = m_ctl.create_custom_sensor(0);
        up_arrow = m_ctl.create_custom_sensor(0);
        down_arrow = m_ctl.create_custom_sensor(0);

        _character = m_scs.get_first_character();

        setup_camera();
        if (DODDLE.commons.testPhone()) {
            document.getElementById("ctrl").style.visibility = "visible";
            document.getElementById("gauche").addEventListener("touchstart", touch_left_cb, false);
            document.getElementById("gauche").addEventListener("touchend", touchend_left_cb, false);
            document.getElementById("droite").addEventListener("touchstart", touch_right_cb, false);
            document.getElementById("droite").addEventListener("touchend", touchend_right_cb, false);
            document.getElementById("haut").addEventListener("touchstart", touch_up_cb, false);
            document.getElementById("haut").addEventListener("touchend", touchend_up_cb, false);
            document.getElementById("bas").addEventListener("touchstart", touch_down_cb, false);
            document.getElementById("bas").addEventListener("touchend", touchend_down_cb, false);
        }

        setup_movement(up_arrow, down_arrow);
        setup_rotation(right_arrow, left_arrow);
    }

    function touch_left_cb(e) {
        event.preventDefault();
        m_ctl.set_custom_sensor(left_arrow, 1);
    }

    function touchend_left_cb(e) {
        event.preventDefault();
        m_ctl.set_custom_sensor(left_arrow, 0);
    }

    function touch_right_cb(e) {
        event.preventDefault();
        m_ctl.set_custom_sensor(right_arrow, 1);
    }

    function touchend_right_cb(e) {
        event.preventDefault();
        m_ctl.set_custom_sensor(right_arrow, 0);
    }

    function touch_up_cb(e) {
        event.preventDefault();
        m_ctl.set_custom_sensor(up_arrow, 1);
    }

    function touchend_up_cb(e) {
        event.preventDefault();
        m_ctl.set_custom_sensor(up_arrow, 0);
    }

    function touch_down_cb(e) {
        event.preventDefault();
        m_ctl.set_custom_sensor(down_arrow, 1);
    }

    function touchend_down_cb(e) {
        event.preventDefault();
        m_ctl.set_custom_sensor(down_arrow, 0);
    }


    function setup_camera() {
        var camera = m_scs.get_active_camera();
        m_cons.append_semi_soft(camera, _character, CAMERA_OFFSET);
    }

    function setup_rotation(right_arrow, left_arrow) {
        var key_a = m_ctl.create_keyboard_sensor(m_ctl.KEY_A);
        var key_d = m_ctl.create_keyboard_sensor(m_ctl.KEY_D);
        var key_left = m_ctl.create_keyboard_sensor(m_ctl.KEY_LEFT);
        var key_right = m_ctl.create_keyboard_sensor(m_ctl.KEY_RIGHT);

        var elapsed_sensor = m_ctl.create_elapsed_sensor();

        var rotate_array = [
            key_a, key_left, left_arrow,
            key_d, key_right, right_arrow,
            elapsed_sensor,
        ];

        var left_logic = function (s) {
            return (s[0] || s[1] || s[2])
        };
        var right_logic = function (s) {
            return (s[3] || s[4] || s[5])
        };

        function rotate_cb(obj, id, pulse) {
            var elapsed = m_ctl.get_sensor_value(obj, "LEFT", 6);

            if (pulse == 1) {
                switch (id) {
                    case "LEFT":
                        m_phy.character_rotation_inc(obj, elapsed * ROT_SPEED, 0);
                        break;
                    case "RIGHT":
                        m_phy.character_rotation_inc(obj, -elapsed * ROT_SPEED, 0);
                        break;
                }
            }
        }

        m_ctl.create_sensor_manifold(_character, "LEFT", m_ctl.CT_CONTINUOUS,
            rotate_array, left_logic, rotate_cb);
        m_ctl.create_sensor_manifold(_character, "RIGHT", m_ctl.CT_CONTINUOUS,
            rotate_array, right_logic, rotate_cb);
    }

    function setup_movement(up_arrow, down_arrow) {
        var key_w = m_ctl.create_keyboard_sensor(m_ctl.KEY_W);
        var key_s = m_ctl.create_keyboard_sensor(m_ctl.KEY_S);
        var key_up = m_ctl.create_keyboard_sensor(m_ctl.KEY_UP);
        var key_down = m_ctl.create_keyboard_sensor(m_ctl.KEY_DOWN);

        var move_array = [
            key_w, key_up, up_arrow,
            key_s, key_down, down_arrow
        ];

        var forward_logic = function (s) {
            return (s[0] || s[1] || s[2])
        };
        var backward_logic = function (s) {
            return (s[3] || s[4] || s[5])
        };

        function move_cb(obj, id, pulse) {
            if (pulse == 1) {
                switch (id) {
                    case "FORWARD":
                        var move_dir = -2;
                        //               m_anim.apply(_character_rig, "character_run");
                        break;
                    case "BACKWARD":
                        var move_dir = 2;
                        //             m_anim.apply(_character_rig, "character_run");
                        break;
                }
            } else {
                var move_dir = 0;
                //   m_anim.apply(_character_rig, "character_idle_01");
            }
            m_phy.set_character_move_dir(obj, move_dir, 0);
        }

        m_ctl.create_sensor_manifold(_character, "FORWARD", m_ctl.CT_TRIGGER,
            move_array, forward_logic, move_cb);
        m_ctl.create_sensor_manifold(_character, "BACKWARD", m_ctl.CT_TRIGGER,
            move_array, backward_logic, move_cb);
    }

    function test(e) {
        console.log("Bam!" + e);
    }

    init();
}


/*
    function registerMouse() {
        console.log("mouse registered");
        var clickSensor = m_ctl.create_touch_click_sensor();

        function cb(obj, id, pulse, param) {
            console.log("----------------------------------");
            console.log(id);
            console.log(pulse);
            var elapsed_sensor = m_ctl.create_elapsed_sensor();
            var el = m_ctl.get_sensor_value(obj, id, 0);
            console.log("----------------------------------");
            console.log("----------------------------------");
            console.log(el);
            console.log("----------------------------------");
            console.log("----------------------------------");

            switch (m_scs.get_object_name(obj)) {
                case "haut":
                    m_phy.set_character_move_dir(_character, -1, 0);
                    break;
                case "bas":
                    m_phy.set_character_move_dir(_character, 1, 0);
                    break;
                case "gauche":
                    m_phy.character_rotation_inc(_character, elapsed * ROT_SPEED, 0);
                    break;
                case "droite":
                    m_phy.character_rotation_inc(_character, elapsed * -ROT_SPEED, 0);
                    break;
                default:
                    m_phy.set_character_move_dir(_character, 0, 0);
                    break;
            }
            return;
        };

        function logic(triggers) {
            if (triggers[0])
                return 1;
            else
                return 0;
        }

        m_ctl.create_sensor_manifold(null,
            "mouse1",
            m_ctl.CT_CONTINUOUS, [clickSensor],
            logic,
            cb,
        );
    }*/

/*
    function main_canvas_up(e) {
        var x = m_mouse.get_coords_x(e);
        var y = m_mouse.get_coords_y(e);

        var obj = m_scs.pick_object(x, y);

        if (e.preventDefault)
            e.preventDefault();

        console.log("Up:" + m_scs.get_object_name(obj));
        m_phy.set_character_move_dir(_character, 0, 0);
        return false;
    }

    function main_canvas_down(e) {
        var x = m_mouse.get_coords_x(e);
        var y = m_mouse.get_coords_y(e);

        var obj = m_scs.pick_object(x, y);
        if (e.preventDefault)
            e.preventDefault();

        console.log("Down:" + m_scs.get_object_name(obj));
        switch (m_scs.get_object_name(obj)) {
            case "haut":
                m_phy.set_character_move_dir(_character, -1, 0);
                break;
            case "bas":
                m_phy.set_character_move_dir(_character, 1, 0);
                break;
            case "gauche":
                m_phy.character_rotation_inc(_character, ROT_SPEED, 0);
                break;
            case "droite":
                m_phy.character_rotation_inc(_character, -ROT_SPEED, 0);
                break;
            default:
                m_phy.set_character_move_dir(_character, 0, 0);
                break;

        }

        return false;
    }*/

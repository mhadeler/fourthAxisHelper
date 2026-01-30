import fs from 'fs';

export type Tool = {
    tool_name?: string;
    bit_width: number;
    spindle_speed: number;
    feed_rate: number;
    step_down: number;
    plunge_feed_rate: number;
}

export type FourthAxisConstructorOptions = {
    startX: number;
    startY?: number;
    startZ: number;
    minZ: number;
    tools: Tool[];
    xOffset?: number;
    fourth_axis_speed?: number;
}

export default class FourthAxisHelper {
    #x: number;
    #y: number;
    #z: number;
    #a = 0;

    #output = '';

    #tools: Tool[];
    #current_tool: Tool;
    #currentToolNum = 1;

    #half_bit: number;
    #step_down: number;
    #spindle_speed: number;
    #feed_rate: number;
    #plunge_feed_rate: number;

    startX: number;
    startY: number;
    startZ: number;
    minZ: number;
    maxZ: number;
    xOffset: number;

    constructor ({
        startX, 
        startY = 0, 
        startZ,
        minZ,
        tools,
        xOffset = -20.74, 
        fourth_axis_speed = 500
    }: FourthAxisConstructorOptions) {

        this.#tools = tools;
        this.#current_tool = this.#tools[this.#currentToolNum-1];

        this.#half_bit = this.#current_tool.bit_width/2;
        this.#step_down = this.#current_tool.step_down;
        this.#spindle_speed = this.#current_tool.spindle_speed;

        this.#feed_rate = this.#current_tool.feed_rate;
        this.#plunge_feed_rate = this.#current_tool.plunge_feed_rate;

        this.startX = startX;
        this.startY = startY;
        this.startZ = startZ;
        this.minZ = minZ;
        this.maxZ = minZ;
        this.xOffset = xOffset;

        this.#x = startX + xOffset;
        this.#y = startY;
        this.#z = startZ;

        this.#addStartCodes(fourth_axis_speed);
    }

    #addStartCodes (fourth_axis_speed: number) {
        this.#output += `\
G90 G21 ; Absolute positioning (G90) -- millimeter units (G21)   
T${this.#currentToolNum} M6 ; Auto tool change - no wireless probe
M7 ; Start airflow
G92.4 A0 R0 ; Set homing
S${this.#spindle_speed} M3 ; Set spindle speed (rpm)
 
G0 X${this.#x.toFixed(2)}
G0 Y${this.#y.toFixed(2)}
G1 Z${this.#z.toFixed(2)}
G1 A${this.#a.toFixed(0)} F${fourth_axis_speed}
; start custom gcode
`
    }

    #addEndCodes () {
        this.#output += `\
; end custom gcode
G0 Z${this.maxZ + 5}
G0 Y${this.maxZ + 5}
M9
M05
G28
M02
`
    }

    #round2DecimalPlaces(num: number) {
        return Math.round((num + Number.EPSILON) * 100) / 100;
    }

    get x() { return this.#x - this.xOffset }
    get y() { return this.#y }
    get z() { return this.#z }
    get current_tool() { return this.#current_tool }

    #outputX() {
        if (this.#feed_rate !== this.#current_tool.feed_rate) {
            this.#feed_rate = this.#current_tool.feed_rate;
            this.#output += `G1 X${this.#x.toFixed(2)} F${this.#feed_rate} \n`;
        } else {
            this.#output += `G1 X${this.#x.toFixed(2)} \n`;
        }
    }

    setX(xVal: number) { 
        this.#x = this.#round2DecimalPlaces(xVal + this.xOffset);
    }

    setXRelative(relAmount: number) { 
        this.#x = this.#round2DecimalPlaces(this.#x + relAmount)
    }

    moveX(xVal: number) { 
        this.setX(xVal);
        this.#outputX();
    }

    moveXWithRotation(
        xVal: number,
        degrees: number,
    ) {
        this.setX(xVal);
        this.#a += degrees;
        this.#output += `G1 X${this.#x.toFixed(2)} A${this.#a.toFixed(2)} \n`;
    }

    moveXRelative(relAmount: number) {
        this.setXRelative(relAmount);
        this.#outputX();
    }

    moveXRelativeWithRotation(
        relAmount: number,
        degrees: number,
    ) {
        this.setXRelative(relAmount);
        this.#a += degrees;
        this.#output += `G1 X${this.#x.toFixed(2)} A${this.#a.toFixed(2)} \n`;
    }

    #outputY() {
        if (this.#feed_rate !== this.#current_tool.feed_rate) {
            this.#feed_rate = this.#current_tool.feed_rate;
            this.#output += `G1 Y${this.#y.toFixed(2)} F${this.#feed_rate} \n`;
        } else {
            this.#output +=  `G1 Y${this.#y.toFixed(2)} \n`
        } 
    }

    setY(yVal: number) { 
        this.#y = this.#round2DecimalPlaces(yVal); 
    }

    setYRelative(relAmount: number) { 
        this.#y = this.#round2DecimalPlaces(this.#y + relAmount);
    }

    moveY(yVal: number) {
        this.setY(yVal);
        this.#outputY();
    }

    moveYWithRotation(
        yVal: number,
        degrees: number,
    ) {
        this.setY(yVal);
        this.#a += degrees;
        this.#output += `G1 Y${this.#y.toFixed(2)} A${this.#a.toFixed(2)} \n`;
    }

    moveYRelative(relAmount: number) {
        this.setY(this.#y + relAmount);
        this.#outputY();
    }

    moveYRelativeWithRotation(
        relAmount: number,
        degrees: number,
    ) {
        this.setYRelative(relAmount);
        this.#a += degrees;
        this.#output += `G1 Y${this.#y.toFixed(2)} A${this.#a.toFixed(2)} \n`;
    }

    resetY() { 
        if (this.#y!== this.startY) {
            this.moveY(this.startY);
        }
    }

    moveXYWithRotation(
        xVal: number,
        yVal: number,
        degrees: number,
    ) {
        this.setX(xVal);
        this.setY(yVal);
        this.#a += degrees;
        this.#output += `G1 X${this.#x.toFixed(2)} Y${this.#y.toFixed(2)} A${this.#a.toFixed(2)} \n`;
    }

    moveXYRelativeWithRotation(
        relXAmount: number,
        relYAmount: number,
        degrees: number,
    ) {
        this.setXRelative(relXAmount);
        this.setYRelative(relYAmount);
        this.#a += degrees;
        this.#output += `G1 X${this.#x.toFixed(2)} Y${this.#y.toFixed(2)} A${this.#a.toFixed(2)} \n`;
    }

    #outputZ() {
        if (this.#plunge_feed_rate !== this.#current_tool.plunge_feed_rate) {
            this.#plunge_feed_rate = this.#current_tool.plunge_feed_rate;
            this.#output += `G1 Z${this.#z.toFixed(2)} F${this.#plunge_feed_rate} \n`;
        } else {
            this.#output +=  `G1 Z${this.#z.toFixed(2)} \n`;
        } 
    }

    setZ(zVal: number) { 
        this.#z = this.#round2DecimalPlaces(zVal); 
    }

    setZRelative(relAmount: number) { 
        this.#z = this.#round2DecimalPlaces(this.#z + relAmount);
    }

    moveZ(zVal: number) {
        this.setZ(zVal);
        this.#outputZ();
    }

    moveZRelative(relAmount: number) {
        this.setZ(this.#z + relAmount);
        this.#outputZ();
    }

    resetZ() {
        if (this.#z !== this.startZ) {
            this.moveZ(this.startZ);
        } 
    }

    saveStartZ(newStartZ = this.#z) { this.startZ = newStartZ }

    stepDown(step_amount = this.#step_down) {
        this.moveZRelative(-step_amount);
    }

    #outputA() { this.#output += `G1 A${this.#a.toFixed(0)} \n`; }

    rotate4thAxis(degrees: number) {
        this.#a += degrees;
        this.#outputA();
    }

    cutRingAtLength(
        cut_end: 'head' | 'tail' | 'center' = 'center', 
        cut_x_position?: number, 
        end_z = this.minZ,
        reset_cut_end_offset: boolean = true,
    ) {
        this.resetZ();
        if (typeof cut_x_position === 'number') {
            this.setX(cut_x_position);
        }

        // Set bit width offset for cut_end settings
        if (cut_end === 'tail') {
            this.setXRelative(this.#half_bit);
        } else if (cut_end === 'head') {
            this.setXRelative(-this.#half_bit);
        }
        this.#outputX();

        while (this.#z > (end_z + this.#step_down)) {
            this.stepDown();
            this.rotate4thAxis(360);
        }
        if (this.#z > end_z) {
            this.moveZ(end_z);
            this.rotate4thAxis(360);
        }
        this.resetZ();

        // Reset bit width offset
        if (reset_cut_end_offset) {
            if (cut_end === 'tail') {
                this.moveXRelative(-this.#half_bit);
            } else if (cut_end === 'head') {
                this.moveXRelative(this.#half_bit);
            }
        }
    }

    millToRadius(
        min_x: number, 
        max_x: number, 
        radius: number, 
        step_amount = this.#step_down
    ) {
        this.resetZ();
        this.resetY();

        const min = Math.min(min_x, max_x);
        const max = Math.max(min_x, max_x);

        const radiusPass = () => {
            this.rotate4thAxis(360);
            while (this.#x > (min + this.#half_bit + step_amount)) {
                this.moveXRelative(-step_amount);
                this.rotate4thAxis(360);
            }
            if (this.#x > (min + this.#half_bit)) {
                this.moveX(min + this.#half_bit);
                this.rotate4thAxis(360);
            }
        }

        this.moveX(max - this.#half_bit);

        while (this.#z > radius + step_amount) {
            this.stepDown();
            radiusPass();

            // Give Z clearance and reset X
            this.moveZRelative(2);
            this.moveX(max - this.#half_bit);
            this.moveZRelative(-2);
        }
        if (this.#z > radius) {
            this.moveZ(radius);
            radiusPass();
        }

        this.resetZ();
    }

    clockwiseArc(
        relative_end_x: number,
        relative_end_y: number,
        relative_center_x: number,
        relative_center_y: number,
    ) {
        this.setXRelative(relative_end_x);
        this.setYRelative(relative_end_y);
        this.#output += `G2 X${this.#x.toFixed(2)} Y${this.#y.toFixed(2)} I${relative_center_x.toFixed(2)} J${relative_center_y.toFixed(2)} \n`;
    }

    counterClockwiseArc(
        relative_end_x: number,
        relative_end_y: number,
        relative_center_x: number,
        relative_center_y: number,
    ) {
        this.setXRelative(relative_end_x);
        this.setYRelative(relative_end_y);
        this.#output += `G3 X${this.#x.toFixed(2)} Y${this.#y.toFixed(2)} I${relative_center_x.toFixed(2)} J${relative_center_y.toFixed(2)} \n`;
    }

    addCustomGCode(custom_code: string) {
        this.#output += custom_code;
        this.#output += `\n`;
    }

    #clockwiseCircleFromLeft(circleOffset: number) {
        this.#output += `G2 X${this.#x.toFixed(2)} Y${this.#y.toFixed(2)} I${circleOffset.toFixed(2)} J0 \n`;
    }

    cutHole(
        radius: number, 
        hole_x_position?: number, 
        end_z = this.minZ
    ) {
        this.resetZ();

        const circleOffset = radius - this.#half_bit;
        if (typeof hole_x_position === 'number') {
            this.moveX(hole_x_position - circleOffset);
        } else {
            this.moveXRelative(-circleOffset);
        }

        this.#clockwiseCircleFromLeft(circleOffset);

        while (this.#z > end_z + this.#step_down) {
            this.stepDown();
            this.#clockwiseCircleFromLeft(circleOffset);
        }
        if (this.#z > end_z) {
            this.moveZ(end_z);
            this.#clockwiseCircleFromLeft(circleOffset);
        }

        this.moveXRelative(circleOffset);
        this.resetZ();
    }

    flatten(
        min_x: number, 
        max_x: number, 
        y_deviation: number, 
        end_z: number, 
        step_amount = this.#step_down
    ) {
        this.resetZ();

        const min = Math.min(min_x, max_x);
        const max = Math.max(min_x, max_x);

        this.moveY(y_deviation - this.#half_bit);

        const flatteningPass = () => {
            this.moveY(this.#y * -1);
            while (this.#x > (min + this.#half_bit + step_amount)) {
                this.moveXRelative(-step_amount);
                this.moveY(this.#y * -1);
            }
            if (this.#x > (min + this.#half_bit)) {
                this.moveX(min + this.#half_bit);
                this.moveY(this.#y * -1);
            }
        }

        while (this.#z > end_z + step_amount) {
            this.moveX(max - this.#half_bit);
            this.stepDown(step_amount);
            flatteningPass();
        }
        if (this.#z > end_z) {
            this.moveX(max - this.#half_bit);
            this.moveZ(end_z);
            flatteningPass();
        }

        this.resetZ();
        this.resetY();

    }

    plunge(
        x_position?: number,
        y_position?: number,
        end_z: number = this.minZ,
        feed_rate?: number,
    ) {
        this.resetZ();
        if (typeof x_position === 'number') {
            this.moveX(x_position);
        }
        if (typeof y_position === 'number') {
            this.moveX(y_position);
        }

        if (feed_rate && typeof feed_rate === 'number') {
            const temp_feed_rate = this.#current_tool.plunge_feed_rate;
            this.#current_tool.plunge_feed_rate = feed_rate;
            this.moveZ(end_z);
            this.resetZ();
            this.#current_tool.plunge_feed_rate = temp_feed_rate;
        } else {
            this.moveZ(end_z);
            this.resetZ();
        }
    }

    toolChange(toolNum = this.#currentToolNum + 1) {

        if (!this.#tools[toolNum - 1]) {
            throw new Error("Requested tool doesn't exist");
        }

        this.#current_tool = this.#tools[toolNum - 1];
        this.#half_bit = this.#current_tool.bit_width/2;
        this.#step_down = this.#current_tool.step_down;

        this.#output += `T${toolNum} M6 \n`;

        this.#spindle_speed = this.#current_tool.spindle_speed;
        this.#output += `S${this.#spindle_speed} M3 \n`;

        this.#currentToolNum = toolNum;
    }

    generateGCode(file: string) {
        this.#addEndCodes();

        const filepath = file.includes('/') ? file : `./${file}`;

        fs.writeFile(filepath, this.#output, (err) => {
            if (err) {
                return console.log(err);
            }
            console.log('File saved successfully.');
        })
    }
}


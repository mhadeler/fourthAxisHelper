# Fourth Axis Helper Script

A custom helper class written in TypeScript, used for generating G-code files for CNC machining, specifically to help with fourth axis operations on the Carvera and Carvera Air CNC machines. 

## Getting Started

### Cloning and Installation

To use this library, you'll need to clone this repository locally. You can do this by running the following command in your terminal:

```bash
git clone https://github.com/mhadeler/fourthAxisHelper.git
```

Once cloned, navigate into the repository and install the required dependencies using npm or yarn:

```bash
npm install
# or
yarn install
```

### Example Usage
```typescript
import FourthAxisHelper from './fourthAxisHelper.ts';

const startX = 100;

const cnc = new FourthAxisHelper({
  startX: startX,
  startY: 0,
  startZ: 13,
  minZ: 10,
  tools: [
    {
        tool_name: '3.175*12mm Flat End',
        bit_width: 3.14,
        spindle_speed: 10000,
        feed_rate: 1000,
        plunge_feed_rate: 300,
        step_down: 0.5,
    },
    {
        tool_name: '0.8mm * 5.5mm TiN Coating Corn Bit',
        bit_width: 0.8,
        spindle_speed: 12000,
        feed_rate: 500,
        plunge_feed_rate: 300,
        step_down: 0.3,
    }
  ],
  xOffset: 20,
  fourth_axis_speed: 1000
});

cnc.cutRingAtLength('tail', startX); 
cnc.cutHole(3.15, startX-25); 
cnc.cutHole(3.15, startX-44); 
cnc.cutHole(3.15, startX-63);
cnc.toolChange(2);
cnc.rotate4thAxis(90);
cnc.plunge(startX - 3.5);
cnc.rotate4thAxis(-180);
cnc.plunge(startX - 3.5);
cnc.generateGCode('output.gcode');

```
#### Which Generates:
<img width="931" height="535" alt="image" src="https://github.com/user-attachments/assets/ad197e0f-8884-432c-899e-a6b7788c3346" />

### Generating GCode
To generate the gcode, you can simply execute your script with node. The code will be output to the file/path passed to the `generateGCode()` method.

```bash
node ./path/to/your/script.ts
```

## Contributing
Pull requests are welcome! 

I pretty much just made this for myself to be used for a few very specific use-cases. I don't really intend to update or maintain it, but if it can help others then I'm happy to merge in any useful updates.

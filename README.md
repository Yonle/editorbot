# editorbot
A IRC bot that acts like a code editor

```
11:59 < Yonle> .e main.sh
11:59 < editorbot> Filename: main.sh
11:59 < editorbot> Reading 0 lines of code. To view code, Type .v
11:59 < Yonle> .nl
11:59 < Yonle> .nl
11:59 < Yonle> .nl
11:59 < Yonle> .nl
11:59 < Yonle> .nl
11:59 < Yonle> .nl
11:59 < Yonle> .v
11:59 < editorbot> 1|
11:59 < editorbot> 2|
11:59 < editorbot> 3|
11:59 < editorbot> 4|
11:59 < editorbot> 5|
11:59 < editorbot> 6|
11:59 < editorbot> End of code. To add new line, Type .nl
11:59 < Yonle> 1 #!/usr/bin/env bash
11:59 < Yonle> 2 main() {
12:00 < Yonle> 3   echo "Somewhere over the rainbow"
12:00 < Yonle> 4   echo "It's Beautiful...."
12:00 < Yonle> 5 }
12:00 < Yonle> 6 main
12:00 < Yonle> .v
12:00 < editorbot> 1|#!/usr/bin/env bash
12:00 < editorbot> 2|main() {
12:00 < editorbot> 3|  echo "Somewhere over the rainbow"
12:00 < editorbot> 4|  echo "It's Beautiful...."
12:00 < editorbot> 5|}
12:00 < editorbot> 6|main
12:00 < editorbot> End of code. To add new line, Type .nl
12:00 < Yonle> .s
12:00 < editorbot> main.sh: write 6 lines of code
```

## Setting up
Install all required packages by doing `npm install`, Modify `config.js` based on your use. You can also put some options based on https://node-irc.readthedocs.io/en/latest/API.html#client

When you're done, Run `node index.js`

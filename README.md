# editorbot
A IRC bot that acts like a code editor

```
11:59 < Yonle> .e main.sh
11:59 < editorbot> Filename: main.sh
11:59 < editorbot> Reading 0 lines of code. Type ".h" for basic help.
11:59 < Yonle> .v
11:59 < editorbot> End of code. Type ".nl" to add new line.
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
12:00 < editorbot> End of code. Type ".nl" to add new line.
12:00 < Yonle> .s
12:00 < editorbot> main.sh: write 6 lines of code
```

There's also collaboration feature which allows more than 2 users to code a same code.

## Commands
```
19:25 < editorbot> Hello. I am file editor bot.
19:25 < editorbot> To start editing, type .e [filename]
19:25 < editorbot> You can use .ls, .rn, .rm, .i, and .s to manage your files.
```

Editing commands:
```
19:25 < editorbot> .v  [from] [to]  : View Code
19:25 < editorbot> .nl [lineNumber] : Create new line
19:25 < editorbot> .dl [lineNumber] : Delete Line
19:25 < editorbot> .i  [username]   : Invite user to collaborate
19:25 < editorbot> .rc [username]   : Remove collaborator
19:25 < editorbot> .w               : Write file
19:25 < editorbot> .q               : Quit Session
19:25 < editorbot> How to edit: Type your message in this format: "[lineNumber] [code]"
19:25 < editorbot> Say, You want to edit the 12th line. Type "12 Lorem Ipsum" and done.
```

## Setting up
Install all required packages by doing `npm install`, Modify `config.js` based on your use. You can also put some options based on https://node-irc.readthedocs.io/en/latest/API.html#client

When you're done, Run `node index.js`

const config = require("./config");
const IRC = require("matrix-org-irc");
const fs = require("fs");

const bot = new IRC.Client(config.addr, config.nick, config);
const sess = new Map();

bot.on("message", (nick, to, text) => {
  let userdir = __dirname + "/.codes/" + nick;
  if (nick === config.nick) return;
  if (to === config.nick) to = nick;
  if (sess.has(nick)) {
    // User is in editing session.
    let usess = sess.get(nick);
    switch (text.split(" ")[0]) {
      case ".h":
        bot.say(
          to,
          [
            ".v  [from] [to]  : View Code",
            ".nl [lineNumber] : Create new line",
            ".dl [lineNumber] : Delete Line",
            ".w : Write file",
            ".q : Quit Session & Edit another code",
            'How to edit: Type your message in this format: "[lineNumber] [code]"',
            '             Say, You will edit line 12. Just type "12 Lorem Ipsum" and you\'re done.',
          ].join("\n")
        );
        break;
      case ".v":
        {
          let linenum = Number(text.split(" ").slice(1)[0]);
          let eln = Number(text.split(" ").slice(1)[1]);
          if (linenum) {
            linenum--;
            if (!usess.code[linenum])
              return bot.say(
                to,
                "There's no line " + (linenum + 1) + " in your code."
              );

            let ln = linenum;
            usess.code.slice(linenum).forEach((c) => {
              if (eln && ln >= eln) return;
              ln++;
              bot.say(to, ln + "|" + c);
            });
          } else {
            let ln = 0;
            usess.code.forEach((c) => {
              ln++;

              bot.say(to, ln + "|" + c);
            });
          }
        }

        bot.say(to, "End of code. To add new line, Type .nl");
        break;
      case ".nl":
        {
          let linenum = Number(text.split(" ").slice(1)[0]);
          if (linenum) {
            linenum--;
            if (!usess.code[linenum])
              return bot.say(
                to,
                "There's no line " + (linenum + 1) + " in your code."
              );
            usess.code[linenum] = [" ", usess.code[linenum]];
            return (usess.code = usess.code.flat(Infinity));
          }
          usess.code.push(" ");
        }
        break;
      case ".dl":
        {
          let linenum = Number(text.split(" ").slice(1)[0]);
          if (linenum) return delete usess.code[linenum - 1];
          return usess.code.pop();
        }
        break;
      case ".w":
        try {
          fs.writeFileSync(
            userdir + "/" + usess.filename,
            usess.code.map(i => {
              if (i === " ") i = "";
              return i;
            }).join("\n"),
            "ascii"
          );
          bot.say(
            to,
            `${usess.filename}: write ${usess.code.length} lines of code`
          );
        } catch (error) {
          bot.say(to, error.toString());
          console.error(error);
        }
        break;
      case ".q":
        sess.delete(nick);
        bot.say(to, "quit: " + nick);
        break;
      default:
        let m = text.split(" ");
        let n = parseInt(m[0], 10);
        if (n > 0) usess.code[n - 1] = m.slice(1).join(" ");
        break;
    }
  } else {
    let name = text.split(" ").slice(1).join(" ");
    // User is not in editing session. Handle commands
    switch (text.split(" ")[0]) {
      case ".h":
        bot.say(
          to,
          [
            "Hello. I'm a file editor bot.",
            "To start editing, type .e [filename]",
            "You can use .ls, .rn, or .rm to manage your file.",
          ].join("\n")
        );
        break;
      case ".ls":
        try {
          bot.say(to, fs.readdirSync(userdir).join(", "));
        } catch (error) {
          if (error.code === "ENOENT") return;
          bot.say(to, error.toString());
          console.error(error);
        }
        break;
      case ".rn":
        {
          let splitted = name.split("|");
          let from = splitted[0];
          let toName = splitted[1];
          if (!from || !toName) return bot.say(to, "Usage: .rn [from]|[to]");
          if (
            from.includes("..") ||
            from.includes("/") ||
            toName.includes("..") ||
            toName.includes("/")
          )
            return bot.say(to, "rename: Illegal file name.");

          try {
            fs.renameSync(userdir + "/" + from, userdir + "/" + toName);
            bot.say(to, "rename: " + from + " as " + toName);
          } catch (error) {
            bot.say(to, error.toString());
            console.error(error);
          }
        }
        break;
      case ".rm":
        if (!name) return bot.say(to, "Usage: .rm [filename]");
        if (name.includes("..") || name.includes("/"))
          return bot.say(to, "rm: Illegal file name");

        try {
          fs.rmSync(userdir + "/" + name);
        } catch {}
        bot.say(to, "rm: " + name);
        break;
      case ".e":
        if (!name) name = "main.txt";
        if (name.includes("..") || name.includes("/"))
          return bot.say(to, "edit: Illegal file name");
        sess.set(nick, {
          filename: name,
          code: [],
        });

        if (!fs.existsSync(userdir))
          fs.mkdirSync(userdir, {
            recursive: true,
          });

        if (fs.existsSync(userdir + "/" + name)) {
          sess.get(nick).code = fs
            .readFileSync(userdir + "/" + name, "ascii")
            .split("\n").map(i => {
              if (!i.length) i = " ";
              return i;
            });
        }

        bot.say(to, "Filename: " + name);
        bot.say(
          to,
          "Reading " +
            sess.get(nick).code.length +
            " lines of code. To view code, Type .v"
        );
        break;
    }
  }
});

bot.on("error", console.error);

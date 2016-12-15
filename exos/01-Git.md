# Git

> simulation de l'utilisation de git à plusieurs

```
git clone https://github.com/Acme-Land/play-with-git.git
cd play-with-git
npm install
```

```
.
├── LICENSE
├── README.md
├── git-server.js
├── go.js
├── package.json
├── public
│   └── index.html
├── repos
│   ├── README.md
│   └── init-bare-repo.sh
└── sandbox
    ├── babs
    │   ├── init.sh
    │   └── push.sh
    └── buster
        ├── clone.sh
        └── push.sh
```

## Créer un "repository" partagé

Dans le répertoire `/repos` vous avez un script `init-bare-repo.sh` qui permet de générer un repository partagé accessible à tout le monde. Tous les repositories partagés seront "stockés" dans `/repos`


### Utilisation
```
./init-bare-repo.sh organisation_name repository_name
```

Par exemple:
```
./repos/init-bare-repo.sh repos/acme hello
```

> cela va créer un dossier `acme/hello.git` dans `/repos`

## Lancer le "mini GitHub"

> pour pouvoir "accéder" aux repositories via http
> c'est une application Express.js qui utilise le framework `git-http-backend` pour utiliser le CGI `git http-backend`

```
./go.js
```

## Une utilisatrice (@babs) crée un projet et le "pousse" vers le serveur

### Normalement ...

```
mkdir hello
cd
git init
echo "# hello project" > README.md
git add .
git commit -m "add README.md"
git push http://localhost:5555/gitsrv/acme/hello.git master
```

mais cela va publier un projet avec mes infos persos, et je voudrais le faire en tant que **@babs**.

en fait lorsque vous faites lancer une commande `git init`, cela crée dans le répertoire un sous-répertoire `.git`:

```
.git
├── HEAD
├── branches
├── config
├── description
├── hooks
│   ├── applypatch-msg.sample
│   ├── commit-msg.sample
│   ├── post-update.sample
│   ├── pre-applypatch.sample
│   ├── pre-commit.sample
│   ├── pre-push.sample
│   ├── pre-rebase.sample
│   ├── prepare-commit-msg.sample
│   └── update.sample
├── info
│   └── exclude
├── objects
│   ├── info
│   └── pack
└── refs
    ├── heads
    └── tags
```

Et vous pouvez écrire des informations dans le fichier `config`:
```
[core]
  repositoryformatversion = 0
  filemode = true
  bare = false
  logallrefupdates = true
  ignorecase = true
  precomposeunicode = true
```

et notamment, les informations du user, comme par exemple:
```
[core]
  repositoryformatversion = 0
  filemode = true
  bare = false
  logallrefupdates = true
  ignorecase = true
  precomposeunicode = true
[user]
  name = babs
  email = babs@typunsafe.org
```

du coup j'ai fait un petit script `init.sh` qui va faire ceci pour nous:

```
#!/bin/bash
# ./init.sh repository
mkdir $1
cd $1
git init

echo "[user]" >> .git/config
echo "  name = babs" >> .git/config
echo "  email = babs@typunsafe.org" >> .git/config
```

que nous utiliserons comme ceci dans le répertoire `/babs`:

```
./init.sh hello
```

### Ajoutons un fichier avec du contenu et "poussons"

Là aussi je vous ai fait un scrit (`./push.sh` dans le répertoire `/babs`)

```
#!/bin/bash
# ./push.sh owner_name repository
cd $2
echo "# Yo project" > README.md
git add .
git commit -m "add README.md"
git push http://localhost:5555/gitsrv/$1/$2.git master
```

Donc:
```
./push.sh acme hello
```

**Côté client**, vous obtiendrez quelque chose comme ceci:
```
zeiracorp:babs k33g$ ./push.sh acme hello
[master (root-commit) 4a7bd7e] add README.md
 1 file changed, 1 insertion(+)
 create mode 100644 README.md
Counting objects: 3, done.
Writing objects: 100% (3/3), 226 bytes | 0 bytes/s, done.
Total 3 (delta 0), reused 0 (delta 0)
To http://localhost:5555/gitsrv/acme/hello.git
 * [new branch]      master -> master
```

**Si vous allez faire un tour du côté du "repository" partagé**
```
cd repos/acme/hello.git
```

Et que vous tapez la commande:
```
git log
```

Vous obtiendrez quelque chose comme ceci:
```
commit 4a7bd7ef526bcf411a80bd314ad2c4948a8bbece
Author: babs <babs@typunsafe.org>
Date:   Wed Dec 14 10:19:01 2016 +0100

    add README.md
```

## Un deuxième utilisateur (@buster) veut participer au projet

- je veux que **@buster** clone le projet
- ajoute un nouveau document
- "pousse" son doc vers le projet

Là aussi j'ai crée 2 scripts:

- `clone.sh`
- `push.sh`

### Cloner le repository: **`clone.sh`**

```
#!/bin/bash
# ./clone.sh owner_name repository

git clone http://localhost:5555/gitsrv/$1/$2.git
cd $2
echo "[user]" >> .git/config
echo "  name = buster" >> .git/config
echo "  email = buster@typunsafe.org" >> .git/config
```

Donc, `./clone.sh acme hello` et vous devriez obtenir:

```
./clone.sh acme hello
Cloning into 'hello'...
remote: Counting objects: 3, done.
remote: Total 3 (delta 0), reused 0 (delta 0)
Unpacking objects: 100% (3/3), done.
Checking connectivity... done.
```

si vous faites un `tree hello`:
```
hello
└── README.md
```
Nous avons donc bien "récupérer" le travail de **@babs**

### Faire des modifs (ajouter un doc): **`push.sh`**

```
#!/bin/bash
# ./push.sh owner_name repository

cd $2
echo "some documentation" > DOC.md
git add .
git commit -m "add DOC.md"
git push http://localhost:5555/gitsrv/$1/$2.git master
```

Donc, `./push.sh acme hello` et vous devriez obtenir:
```
./push.sh acme hello
[master 53dfc65] add DOC.md
 1 file changed, 1 insertion(+)
 create mode 100644 DOC.md
Counting objects: 3, done.
Delta compression using up to 8 threads.
Compressing objects: 100% (2/2), done.
Writing objects: 100% (3/3), 292 bytes | 0 bytes/s, done.
Total 3 (delta 0), reused 0 (delta 0)
To http://localhost:5555/gitsrv/acme/hello.git
   4a7bd7e..53dfc65  master -> master
```

**Si vous retournez faire un tour du côté du "repository" partagé**
```
cd repos/acme/hello.git
```

Et que vous tapez la commande:
```
git log
```

Vous obtiendrez quelque chose comme ceci:
```
commit 53dfc6518b8f9be542fe8ea2c9616b47cee88509
Author: buster <buster@typunsafe.org>
Date:   Wed Dec 14 10:38:44 2016 +0100

    add DOC.md

commit 4a7bd7ef526bcf411a80bd314ad2c4948a8bbece
Author: babs <babs@typunsafe.org>
Date:   Wed Dec 14 10:19:01 2016 +0100
```

## @babs doit synchronyser son répertoire pour être à jour

**`sync.sh`**:
```
#!/bin/bash
# ./sync.sh owner_name repository
git pull http://localhost:5555/gitsrv/$1/$2.git
```

Donc, on lance `./sync.sh acme hello` qui devrait nous donner:
```
remote: Counting objects: 3, done.
remote: Compressing objects: 100% (2/2), done.
remote: Total 3 (delta 0), reused 0 (delta 0)
Unpacking objects: 100% (3/3), done.
From http://localhost:5555/gitsrv/acme/hello
 * branch            HEAD       -> FETCH_HEAD
Updating 4a7bd7e..53dfc65
Fast-forward
 DOC.md | 1 +
 1 file changed, 1 insertion(+)
 create mode 100644 DOC.md
```

Et si vous faites un `tree hello`:
```
hello
├── DOC.md
└── README.md
```

## @babs fait des modifications sur `DOC.md`

- aller modifier `DOC.md`
- vous pouvez faire un `git status` pour voir l'état du document

Ensuite
```
git add DOC.md
git commit -m "modification de DOC.md"
git push http://localhost:5555/gitsrv/acme/hello.git master
```

un petit `git log` du côté du "repository" partagé:
```
commit 9d4e7fef5ea173c416fbe95ab98e40be64b5d308
Author: babs <babs@typunsafe.org>
Date:   Wed Dec 14 11:00:19 2016 +0100

    modification de DOC.md

commit 53dfc6518b8f9be542fe8ea2c9616b47cee88509
Author: buster <buster@typunsafe.org>
Date:   Wed Dec 14 10:38:44 2016 +0100

    add DOC.md

commit 4a7bd7ef526bcf411a80bd314ad2c4948a8bbece
Author: babs <babs@typunsafe.org>
Date:   Wed Dec 14 10:19:01 2016 +0100
```

## @buster fait des modifications sur `DOC.md`

> sans se synchroniser 🙀

- aller modifier `DOC.md`

Ensuite
```
git add DOC.md
git commit -m "modification de DOC.md par buster"
git push http://localhost:5555/gitsrv/acme/hello.git master
```

Et là c'est le drame!!!:
```
[master 9ec0ae7] modification de DOC.md par buster
 1 file changed, 2 insertions(+)
zeiracorp:hello k33g$ git push http://localhost:5555/gitsrv/acme/hello.git master
To http://localhost:5555/gitsrv/acme/hello.git
 ! [rejected]        master -> master (fetch first)
error: failed to push some refs to 'http://localhost:5555/gitsrv/acme/hello.git'
hint: Updates were rejected because the remote contains work that you do
hint: not have locally. This is usually caused by another repository pushing
hint: to the same ref. You may want to first integrate the remote changes
hint: (e.g., 'git pull ...') before pushing again.
hint: See the 'Note about fast-forwards' in 'git push --help' for details.
```

Du coup, on synchronyse:
```
git pull http://localhost:5555/gitsrv/acme/hello.git
```

On obtient:
```
remote: Counting objects: 3, done.
remote: Compressing objects: 100% (3/3), done.
remote: Total 3 (delta 0), reused 0 (delta 0)
Unpacking objects: 100% (3/3), done.
From http://localhost:5555/gitsrv/acme/hello
 * branch            HEAD       -> FETCH_HEAD
Auto-merging DOC.md
CONFLICT (content): Merge conflict in DOC.md
Automatic merge failed; fix conflicts and then commit the result.
```

si vous faites un `git status`:
```
On branch master
Your branch is ahead of 'origin/master' by 2 commits.
  (use "git push" to publish your local commits)
You have unmerged paths.
  (fix conflicts and run "git commit")
  (use "git merge --abort" to abort the merge)

Unmerged paths:
  (use "git add <file>..." to mark resolution)

	both modified:   DOC.md

no changes added to commit (use "git add" and/or "git commit -a")
```

si vous ouvrez `DOC.md`:

```
some documentation
<<<<<<< HEAD
Hi I'm buster :)
=======
Hello this is a comment from @babs
>>>>>>> 9d4e7fef5ea173c416fbe95ab98e40be64b5d308
```

> Modifiez `DOC.md` et sauvegardez

```
git add DOC.md
git commit -m "ajout de mes modifications à celle de @babs"
git push http://localhost:5555/gitsrv/acme/hello.git master
```

Vous obtiendrez:
```
Counting objects: 6, done.
Delta compression using up to 8 threads.
Compressing objects: 100% (5/5), done.
Writing objects: 100% (6/6), 676 bytes | 0 bytes/s, done.
Total 6 (delta 0), reused 0 (delta 0)
To http://localhost:5555/gitsrv/acme/hello.git
   9d4e7fe..e98644e  master -> master
```

un petit `git log` du côté du "repository" partagé:
```
commit e98644e34df9972f0c15835182772c8f1692e2c8
Merge: 9ec0ae7 9d4e7fe
Author: buster <buster@typunsafe.org>
Date:   Wed Dec 14 11:23:24 2016 +0100

    ajout de mes modifications à celle de @babs

commit 9ec0ae7fa8337dbce2d7739e4aa0513a0eaa7848
Author: buster <buster@typunsafe.org>
Date:   Wed Dec 14 11:06:52 2016 +0100

    modification de DOC.md par buster

commit 9d4e7fef5ea173c416fbe95ab98e40be64b5d308
Author: babs <babs@typunsafe.org>
Date:   Wed Dec 14 11:00:19 2016 +0100

    modification de DOC.md

commit 53dfc6518b8f9be542fe8ea2c9616b47cee88509
Author: buster <buster@typunsafe.org>
Date:   Wed Dec 14 10:38:44 2016 +0100

    add DOC.md

commit 4a7bd7ef526bcf411a80bd314ad2c4948a8bbece
Author: babs <babs@typunsafe.org>
Date:   Wed Dec 14 10:19:01 2016 +0100

    add README.md
```

et enfin si **@babs** fait un `git pull http://localhost:5555/gitsrv/acme/hello.git`:
```
remote: Counting objects: 6, done.
remote: Compressing objects:  2remote: Compressing objects:  4remote: Compressing objects:  6remote: Compressing objects:  8remote: Compressing objects: 10remote: Compressing objects: 100% (5/5), done.
remote: Total 6 (delta 0), reused 0 (delta 0)
Unpacking objects:  16% (1/6)  Unpacking objects:  33% (2/6)  Unpacking objects:  50% (3/6)  Unpacking objects:  66% (4/6)  Unpacking objects:  83% (5/6)  Unpacking objects: 100% (6/6)  Unpacking objects: 100% (6/6), done.
From http://localhost:5555/gitsrv/acme/hello
 * branch            HEAD       -> FETCH_HEAD
Updating 9d4e7fe..e98644e
Fast-forward
 DOC.md | 1 +
 1 file changed, 1 insertion(+)
```

etc...

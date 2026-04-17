/*
Quick Add overlay — keyboard-first hero picker.

Flow:
    Q           open overlay (step 1: team select)
    1 / 2       pick Ally / Enemy team (step 2: hero list)
    typing      filter heroes live; best match highlighted
    Enter       add highlighted hero, clear filter (stay open)
    Esc         close overlay

Hero list is grouped by role (Tank / Damage / Support), alphabetical within
each role. Ordering is stable across adds so muscle memory is preserved.
*/

const ROLES = ["Tank", "Damage", "Support"];

class ViewQuickAdd {
    constructor(model, controller) {
        this.model = model;
        this.controller = controller;

        this.open = false;
        this.step = 1;           // 1 = team select, 2 = hero pick
        this.team = null;        // "Blue" | "Red"
        this.query = "";
        this.matches = [];       // flat list of hero names currently visible, in display order
        this.activeIdx = 0;      // index into this.matches for Enter

        this._buildDOM();
        this._bindKeys();
    }

    _buildDOM() {
        const root = document.createElement("div");
        root.id = "quick-add-overlay";
        root.className =
            "hidden fixed inset-0 z-50 bg-black/85 overflow-y-auto " +
            "flex items-start justify-center py-8 px-4";
        root.setAttribute("role", "dialog");
        root.setAttribute("aria-label", "Quick Add");

        // Click on backdrop closes
        root.addEventListener("mousedown", (e) => {
            if (e.target === root) this.close();
        });

        const panel = document.createElement("div");
        panel.className =
            "relative w-full max-w-5xl bg-[#1C2E37] border-2 border-white/20 " +
            "rounded-lg p-6 sm:p-8 text-white";

        // Title
        this.titleEl = document.createElement("h2");
        this.titleEl.className =
            "fjalla text-3xl sm:text-4xl uppercase text-center mb-1";
        this.titleEl.textContent = "Quick Add";

        // Subtitle / hint
        this.subtitleEl = document.createElement("p");
        this.subtitleEl.className =
            "poppins text-sm sm:text-base text-center text-slate-300 mb-6";

        // --- Step 1: team select ---
        this.step1 = document.createElement("div");
        this.step1.className = "grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6";

        this.allyBtn = this._teamButton("Ally Team", "1", "bg-sky-600", "hover:bg-sky-500");
        this.enemyBtn = this._teamButton("Enemy Team", "2", "bg-red-600", "hover:bg-red-500");
        this.allyBtn.addEventListener("click", () => this._pickTeam("Blue"));
        this.enemyBtn.addEventListener("click", () => this._pickTeam("Red"));
        this.step1.append(this.allyBtn, this.enemyBtn);

        // --- Step 2: hero pick ---
        this.step2 = document.createElement("div");
        this.step2.className = "hidden";

        this.queryEl = document.createElement("div");
        this.queryEl.className =
            "fjalla text-2xl sm:text-3xl uppercase text-center mb-4 min-h-[2.5rem] " +
            "border-b-2 border-white/30 pb-2";

        this.rolesWrap = document.createElement("div");
        this.rolesWrap.className = "grid grid-cols-1 gap-6";

        // Pre-build role sections (populated lazily when opened)
        this.roleSections = {};
        for (const role of ROLES) {
            const section = document.createElement("div");

            const header = document.createElement("h3");
            header.className =
                "fjalla text-2xl uppercase mb-2 border-b border-white/20 pb-1";
            header.textContent = role;

            const list = document.createElement("div");
            list.className = "flex flex-wrap gap-2";

            section.append(header, list);
            this.roleSections[role] = { section, list };
            this.rolesWrap.appendChild(section);
        }

        this.step2.append(this.queryEl, this.rolesWrap);

        // Footer hint
        this.footerEl = document.createElement("p");
        this.footerEl.className =
            "poppins text-xs text-slate-400 text-center mt-6";

        panel.append(this.titleEl, this.subtitleEl, this.step1, this.step2, this.footerEl);
        root.appendChild(panel);
        document.body.appendChild(root);
        this.root = root;
        this.panel = panel;
    }

    _teamButton(label, keyHint, bg, hoverBg) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className =
            `${bg} ${hoverBg} transition-colors rounded-lg py-10 sm:py-16 ` +
            "flex flex-col items-center justify-center gap-2 cursor-pointer " +
            "border-4 border-transparent hover:border-white/40 select-none";

        const name = document.createElement("span");
        name.className = "fjalla text-3xl sm:text-5xl uppercase";
        name.textContent = label;

        const hint = document.createElement("span");
        hint.className = "poppins text-sm sm:text-base uppercase opacity-80";
        hint.textContent = `Press ${keyHint}`;

        btn.append(name, hint);
        return btn;
    }

    _bindKeys() {
        document.addEventListener("keydown", (e) => this._onKeyDown(e));
    }

    _onKeyDown(e) {
        // If overlay is closed: only "Q" opens it (and only when user isn't typing in some other field)
        if (!this.open) {
            if (e.key === "q" || e.key === "Q") {
                if (this._typingInInput(e.target)) return;
                e.preventDefault();
                this.openOverlay();
            }
            return;
        }

        // Overlay open — capture everything
        if (e.key === "Escape") {
            e.preventDefault();
            this.close();
            return;
        }

        if (this.step === 1) {
            if (e.key === "1") {
                e.preventDefault();
                this._pickTeam("Blue");
            } else if (e.key === "2") {
                e.preventDefault();
                this._pickTeam("Red");
            }
            return;
        }

        // step 2
        if (e.key === "Enter") {
            e.preventDefault();
            this._commitSelected();
            return;
        }
        if (e.key === "Backspace") {
            e.preventDefault();
            this.query = this.query.slice(0, -1);
            this._refreshList();
            return;
        }
        if (e.key === "Tab") {
            e.preventDefault();
            if (this.matches.length > 0) {
                this.activeIdx = (this.activeIdx + (e.shiftKey ? -1 : 1) + this.matches.length) % this.matches.length;
                this._renderActive();
            }
            return;
        }
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            e.preventDefault();
            if (this.matches.length > 0) {
                this.activeIdx = (this.activeIdx + 1) % this.matches.length;
                this._renderActive();
            }
            return;
        }
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            e.preventDefault();
            if (this.matches.length > 0) {
                this.activeIdx = (this.activeIdx - 1 + this.matches.length) % this.matches.length;
                this._renderActive();
            }
            return;
        }
        // Single printable character
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            this.query += e.key.toLowerCase();
            this._refreshList();
        }
    }

    _typingInInput(target) {
        if (!target) return false;
        const tag = (target.tagName || "").toUpperCase();
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
        if (target.isContentEditable) return true;
        return false;
    }

    openOverlay() {
        if (!this._hasHeroes()) {
            // Heroes not loaded yet — silently ignore.
            return;
        }
        this.open = true;
        this.step = 1;
        this.team = null;
        this.query = "";
        this.activeIdx = 0;
        this.root.classList.remove("hidden");
        this._renderStep();
    }

    close() {
        this.open = false;
        this.root.classList.add("hidden");
    }

    _pickTeam(team) {
        this.team = team;
        this.step = 2;
        this.query = "";
        this.activeIdx = 0;
        this._renderStep();
    }

    _renderStep() {
        if (this.step === 1) {
            this.titleEl.textContent = "Quick Add — Pick a Team";
            this.subtitleEl.textContent = "Press 1 for Ally, 2 for Enemy — or click.";
            this.step1.classList.remove("hidden");
            this.step2.classList.add("hidden");
            this.footerEl.textContent = "Esc to close";
        } else {
            const label = this.team === "Blue" ? "Ally" : "Enemy";
            this.titleEl.textContent = `Add to ${label} Team`;
            this.subtitleEl.textContent =
                "Type to filter. Enter adds the highlighted hero. Tab / ← → to switch. Esc to close.";
            this.step1.classList.add("hidden");
            this.step2.classList.remove("hidden");
            this.footerEl.textContent =
                "Heroes grouped by role, alphabetical. Selected heroes are dimmed.";
            this._buildHeroList();
            this._refreshList();
        }
    }

    _hasHeroes() {
        const blue = this.model && this.model.teams && this.model.teams["Blue"];
        if (!blue || !blue.heroes) return false;
        return Object.keys(blue.heroes).length > 0;
    }

    _buildHeroList() {
        const team = this.model.teams[this.team];
        const heroes = team.heroes;

        const byRole = { Tank: [], Damage: [], Support: [] };
        for (const name in heroes) {
            const h = heroes[name];
            if (byRole[h.generalRol]) byRole[h.generalRol].push(h);
        }
        for (const role of ROLES) {
            byRole[role].sort((a, b) => a.name.localeCompare(b.name));
        }

        this._heroTiles = {}; // name -> { tile, hero }
        for (const role of ROLES) {
            const { list } = this.roleSections[role];
            while (list.firstChild) list.removeChild(list.firstChild);

            for (const hero of byRole[role]) {
                const tile = this._makeHeroTile(hero);
                tile.addEventListener("click", () => {
                    if (hero.selected) return;
                    this._addHero(hero);
                });
                list.appendChild(tile);
                this._heroTiles[hero.name] = { tile, hero };
            }
        }
    }

    _makeHeroTile(hero) {
        const tile = document.createElement("figure");
        tile.className =
            "w-16 sm:w-20 grid grid-flow-row items-baseline justify-center " +
            "rounded-lg drop-shadow-lg cursor-pointer select-none transition-transform " +
            "border-2 border-transparent hover:-translate-y-1 hover:bg-[#294452]";
        tile.dataset.name = hero.name;

        const cap = document.createElement("figcaption");
        cap.className = "h-6 text-xs sm:text-sm truncate";
        cap.textContent = hero.name;

        const img = document.createElement("img");
        img.className = "h-14 sm:h-16 justify-self-center";
        const heroImg = hero.getIMG && hero.getIMG("white-img");
        if (heroImg && heroImg.src) {
            img.src = heroImg.src;
        } else {
            img.src = "images/assets/blank-hero.webp";
        }
        img.alt = hero.name;

        tile.append(cap, img);
        return tile;
    }

    _refreshList() {
        this.queryEl.textContent = this.query.length > 0 ? this.query : "\u00A0"; // nbsp to preserve height

        const team = this.model.teams[this.team];
        const q = this.query.toLowerCase();

        // Build matches per role in alphabetical (display) order; dim or hide selected heroes.
        const starts = [];
        const rest = [];
        for (const role of ROLES) {
            const { list } = this.roleSections[role];
            // list.children order IS the alphabetical order established in _buildHeroList.
            for (const tile of list.children) {
                const name = tile.dataset.name;
                const hero = team.heroes[name];
                const visible = this._heroMatches(hero, q);

                tile.classList.toggle("hidden", !visible);
                tile.classList.toggle("opacity-30", !!hero.selected);
                tile.classList.toggle("pointer-events-none", !!hero.selected);

                if (visible && !hero.selected) {
                    if (q && name.toLowerCase().startsWith(q)) starts.push(name);
                    else rest.push(name);
                }
            }
        }
        // Prefer "starts with query" at the top of the match list so Enter picks the most likely hero.
        this.matches = starts.concat(rest);
        this.activeIdx = 0;
        this._renderActive();
    }

    _heroMatches(hero, q) {
        if (q === "") return true;
        const name = hero.name.toLowerCase();
        if (name.includes(q)) return true;
        const nicks = hero.nicks;
        if (Array.isArray(nicks)) {
            for (const n of nicks) {
                if (typeof n === "string" && n.toLowerCase().includes(q)) return true;
            }
        }
        return false;
    }

    _renderActive() {
        if (this.activeIdx >= this.matches.length) this.activeIdx = 0;

        // Clear previous active highlight
        for (const name in this._heroTiles) {
            this._heroTiles[name].tile.classList.remove(
                "border-amber-400",
                "bg-[#294452]",
                "-translate-y-1"
            );
        }
        const activeName = this.matches[this.activeIdx];
        if (activeName && this._heroTiles[activeName]) {
            const tile = this._heroTiles[activeName].tile;
            tile.classList.add("border-amber-400", "bg-[#294452]", "-translate-y-1");
            // keep tile in view
            tile.scrollIntoView({ block: "nearest", inline: "nearest" });
        }
    }

    _commitSelected() {
        const name = this.matches[this.activeIdx];
        if (!name) return;
        const team = this.model.teams[this.team];
        const hero = team.heroes[name];
        if (!hero || hero.selected) return;
        this._addHero(hero);
    }

    _addHero(hero) {
        this.controller.handleSelectedHeroes(this.team, hero.name, hero.generalRol);
        this.query = "";
        this._refreshList();
    }
}

export default ViewQuickAdd;

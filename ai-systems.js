(function () {
  const workflowSteps = [
    {
      id: "human-request",
      title: "Human request",
      subtitle: "The work starts as intent",
      preview: "A rough human ask becomes the input signal for the controlled workflow.",
      thumbnail: "./assets/capability-tools.svg",
      images: ["./assets/capability-tools.svg", "./assets/1.jpg"],
      solves: [
        "Prevents Codex from wandering through unrelated work or starting the next task just because it found one.",
        "Turns a human request into an explicit work item with acceptance criteria, evidence requirements, and a stop condition."
      ],
      works: [
        "The prompt is recorded, assigned a cycle id, and decomposed into a queue item. Codex executes only that item, validates it, records evidence, removes or closes the item, and stops.",
        "The active queue becomes the source of execution authority instead of chat momentum."
      ],
      proof: [
        "Best proof assets here are a short Codex session GIF, the active queue JSON before and after, and the execution log entry for the closed item.",
        "Example prompt: implement Q-20260513-220."
      ],
      matters: [
        "This makes AI-assisted work reviewable. A hiring manager can see the request, the scope, the changed files, and the evidence path instead of trusting a vague claim that AI helped."
      ],
      files: [
        "AGENTS.md",
        "_Plant/Doctrine/Queue/ActivePromptQueue.json",
        "_Plant/Doctrine/Queue/PromptMemory.json",
        "_Plant/Doctrine/Queue/PromptExecutionLog.jsonl"
      ]
    },
    {
      id: "queue-item",
      title: "Queue item",
      subtitle: "Intent becomes a tracked task",
      preview: "The request is recorded as one actionable queue item with criteria and required evidence.",
      thumbnail: "./assets/capability-ai-output.svg",
      images: ["./assets/capability-ai-output.svg", "./assets/2.jpg"],
      solves: [
        "Stops every project from reinventing the same AI workflow rules from scratch.",
        "Keeps reusable process infrastructure separate from the game-specific project layer."
      ],
      works: [
        "Foundation Seed owns shared doctrine, validation expectations, package structure, queue rules, and reusable development patterns.",
        "The Plant layer owns project-specific system maps, design docs, active queue state, generated asset rules, and implementation evidence. Proven Plant patterns can move back into Foundation."
      ],
      proof: [
        "Strong proof assets would show the Foundation package docs next to project-specific Plant maps and a decision record where a local rule becomes reusable."
      ],
      matters: [
        "It demonstrates reusable architecture thinking, not just local prompt engineering. The workflow can move between projects because the responsibilities are separated."
      ],
      files: [
        "Packages/FoundationSeed/Documentation~/Doctrine/",
        "Packages/FoundationSeed/Documentation~/Systems/",
        "_Plant/Doctrine/",
        "_Plant/SystemMap/"
      ]
    },
    {
      id: "doctrine-maps",
      title: "Codex reads doctrine",
      subtitle: "Rules and ownership load first",
      preview: "Codex reads startup instructions, doctrine, system maps, decisions, and current queue state before editing.",
      thumbnail: "./assets/player-dev-tools.svg",
      images: ["./assets/player-dev-tools.svg", "./assets/3.jpg"],
      solves: [
        "Stops AI from editing a file without understanding the contract that file is supposed to uphold.",
        "Makes stale code, hidden dependencies, and ownership drift easier to catch."
      ],
      works: [
        "Every governed script describes its purpose, ownership boundaries, dependencies, known callers, extension points, failure modes, verification date, and recent changes.",
        "Codex reads the declaration-site documentation before changing code and updates it when the behavior contract changes."
      ],
      proof: [
        "Best proof assets are before-and-after script header screenshots, a parser report showing required sections, and a Codex patch that updates code plus documentation together."
      ],
      matters: [
        "This keeps AI work from becoming archaeology. The next session can open the file and immediately understand why it exists and what must not be broken."
      ],
      files: [
        "_Plant/Doctrine/ScriptHeaderDoctrine.md",
        "_Plant/Doctrine/StaleCodeDoctrine.md",
        "Packages/FoundationSeed/Documentation~/Doctrine/ScriptHeaderAndStaleCodeDoctrine.md",
        "Assets/Plant/Runtime/"
      ]
    },
    {
      id: "scoped-code-changes",
      title: "scoped code changes",
      subtitle: "Only the owned files change",
      preview: "Codex changes the authored source, extension point, generator, or runtime owner responsible for the behavior.",
      thumbnail: "./assets/4.jpg",
      images: ["./assets/4.jpg", "./assets/capability-tools.svg"],
      solves: [
        "Prevents architecture from living only in a chat transcript or in one developer's memory.",
        "Makes it harder for AI to create parallel owners for the same responsibility."
      ],
      works: [
        "Doctrine captures project rules and decisions. System maps capture current owners, important file roots, deprecated systems, generated asset boundaries, and validation status.",
        "When a system changes, the map changes in the same pass so the next task starts from current truth."
      ],
      proof: [
        "Good proof assets would show a messy issue, the code change, and the system-map entry created in the same task."
      ],
      matters: [
        "This is how the project gets smarter over time. Codex does not need to rediscover the same boundary every session."
      ],
      files: [
        "_Plant/SystemMap/SystemMapIndex.md",
        "_Plant/SystemMap/ImpactMap.json",
        "_Plant/Doctrine/Decisions/",
        "_Plant/Design/Systems/"
      ]
    },
    {
      id: "validation",
      title: "validation",
      subtitle: "Done means checked",
      preview: "The task is checked with the validation path that matches its risk: parser, build, scan, log, or visual review.",
      thumbnail: "./assets/5.jpg",
      images: ["./assets/5.jpg", "./assets/capability-ai-output.svg"],
      solves: [
        "Stops fixes from being overwritten the next time Unity sync or generation runs.",
        "Keeps generated output consistent with the authored source that produced it."
      ],
      works: [
        "Generated scenes, prefabs, materials, and assets are treated as output. Codex changes the source JSON, sync step, factory, or generator that owns the output.",
        "If a manual Unity validation step is required, Codex records the handoff instead of pretending the generated artifact was fully validated."
      ],
      proof: [
        "The strongest proof is a side-by-side showing a generated object problem, the source/sync code patch, and the regenerated output after sync."
      ],
      matters: [
        "It shows production discipline. AI can move fast without corrupting a pipeline that depends on generation."
      ],
      files: [
        "Assets/Plant/Authoring/",
        "Assets/Plant/Editor/Sync/",
        "Assets/Plant/Generated/",
        "_Plant/Doctrine/GeneratedArtifactSafetyDoctrine.md"
      ]
    },
    {
      id: "evidence-log",
      title: "evidence log",
      subtitle: "Proof is recorded",
      preview: "The queue execution log records what changed, what passed, what was blocked, and which artifacts prove it.",
      thumbnail: "./assets/6.jpg",
      images: ["./assets/6.jpg", "./assets/player-dev-tools.svg"],
      solves: [
        "Stops clean-looking patches from being treated as correct without proof.",
        "Makes blocked checks visible instead of hiding them inside a final sentence."
      ],
      works: [
        "Codex chooses validation based on risk: compile checks for code, parser checks for data, runtime logs for behavior, and screenshot or human verification for visual work.",
        "The evidence is recorded in queue logs and implementation reports so future work can inspect what actually passed."
      ],
      proof: [
        "Use screenshots of terminal validation, implementation reports, session logs, and before-after visual proof."
      ],
      matters: [
        "Employers need to know whether AI work survives contact with a real project. Evidence logs make the claim concrete."
      ],
      files: [
        "_Plant/Logs/",
        "_Plant/Doctrine/Queue/PromptExecutionLog.jsonl",
        "_Plant/SystemMap/*Report.md",
        "validation command output"
      ]
    },
    {
      id: "docs-updated",
      title: "docs updated",
      subtitle: "The repo remembers",
      preview: "System maps, doctrine, decisions, or task memory are updated when the work changes project truth.",
      thumbnail: "./assets/1.jpg",
      images: ["./assets/1.jpg", "./assets/2.jpg"],
      solves: [
        "Turns vague feedback like this setup makes no sense into an actionable engineering loop.",
        "Separates the emotional signal from the technical owner, acceptance criteria, and proof required."
      ],
      works: [
        "Codex identifies what the complaint points at, finds the responsible systems, scopes the change, updates the owned files, and records the decision or map update that should guide future work.",
        "The modal proof can show the messy critique, the Codex response, changed files, doctrine update, and before-after screenshot."
      ],
      proof: [
        "This card is ideal for a GIF of a Codex task plus a before-after lab screenshot and a short file-change summary."
      ],
      matters: [
        "Real development feedback is rarely perfectly specified. This demonstrates that the workflow can absorb messy human direction without losing engineering control."
      ],
      files: [
        "Codex session transcript",
        "_Plant/Doctrine/Decisions/",
        "_Plant/SystemMap/SystemMapIndex.md",
        "before-after screenshots"
      ]
    },
    {
      id: "next-queue-item",
      title: "next queue item",
      subtitle: "The loop is ready to continue",
      preview: "After the assigned item closes, Codex stops unless the human explicitly assigns or drains the next queue item.",
      thumbnail: "./assets/3.jpg",
      images: ["./assets/3.jpg", "./assets/4.jpg"],
      solves: [
        "Shows how the workflow handles a complex system rebuild without treating the old implementation as code to blindly port.",
        "Captures what was proven, what was abandoned, and what must restart under a new scope."
      ],
      works: [
        "The case study tracks system maps, scaffold docs, queue items, no-port decisions, typed ownership boundaries, runtime/editor split, generated prefab sync, diagnostics, and validation gates.",
        "When the direction changed, the old V1/V2 code was archived as reference evidence instead of remaining active architecture."
      ],
      proof: [
        "The best modal proof would show the queue branch, architecture authority map, generated-prefab report, validation report, and archive decision."
      ],
      matters: [
        "This demonstrates senior engineering judgment around stopping bad momentum, preserving evidence, and restarting from a cleaner problem definition."
      ],
      files: [
        "_Plant/Doctrine/ArchitectureDoctrine.md",
        "_Plant/SystemMap/RuntimeSystemMap.md",
        "_Plant/Doctrine/Decisions/ADR-0004-No-Port-Boundary.md",
        "_Plant/SystemMap/SystemMapIndex.md"
      ]
    }
  ];

  const workflowDetails = {
    "human-request": {
      stepLabel: "01 Workflow step",
      badge: "Input",
      takeaway: "Vague input becomes controlled intent.",
      artifact: {
        type: "quote",
        label: "Raw input",
        quote: "your setup of these elements makes no sense... fix it",
        normalized: "Turn a rough layout critique into an assigned design/system correction with visible before-after proof.",
        tags: ["messy", "visual", "unstructured", "human intent"]
      },
      solves: [
        "Captures the messy human intent before implementation starts.",
        "Keeps the original request visible so the work can be judged against what was actually asked."
      ],
      works: [
        "The human request can be rough, visual, emotional, or incomplete. Codex treats it as the starting signal, then turns it into a governed task instead of immediately editing files.",
        "This step preserves the plain-language problem and separates it from the structured execution plan."
      ],
      proof: [
        "Useful proof here is the original prompt, screenshot, issue note, or critique that started the task."
      ],
      matters: [
        "Real work rarely arrives as perfect specs. The workflow shows that vague feedback can still enter a controlled engineering process."
      ],
      files: [
        "Human prompt or issue text",
        "Screenshots or visual references",
        "Initial problem statement"
      ]
    },
    "queue-item": {
      stepLabel: "02 Workflow step",
      badge: "Task",
      takeaway: "The request becomes one assigned task.",
      artifact: {
        type: "task",
        label: "Tracked task",
        fields: [
          { label: "Queue ID", value: "Q-20260515-320" },
          { label: "Owner", value: "Plant.Runtime" },
          { label: "Scope", value: "runtime capability refactor" },
          { label: "Evidence required", value: "compile checks, focused tests, implementation report" },
          { label: "Completion rule", value: "validate, log evidence, close item" }
        ]
      },
      solves: [
        "Prevents prompt drift by converting the request into one assigned work item.",
        "Defines what counts as complete before code changes begin."
      ],
      works: [
        "The request is recorded with a cycle id, queue item id, acceptance criteria, and evidence requirements.",
        "Codex executes that assigned item and stops after it is complete, failed, or blocked."
      ],
      proof: [
        "Proof is the queue entry before work starts and the closed queue state after completion."
      ],
      matters: [
        "The queue turns AI assistance into a reviewable task system instead of a free-form chat loop."
      ],
      files: [
        "_Plant/Doctrine/Queue/ActivePromptQueue.json",
        "_Plant/Doctrine/Queue/PromptMemory.json"
      ]
    },
    "doctrine-maps": {
      stepLabel: "03 Workflow step",
      badge: "Context",
      takeaway: "Codex reads rules before touching files.",
      artifact: {
        type: "stack",
        label: "Context load order",
        items: [
          "AGENTS.md",
          "Active queue",
          "Queue doctrine",
          "Project system map",
          "Relevant system map",
          "Local script or page contract"
        ]
      },
      solves: [
        "Stops Codex from acting on stale assumptions or inventing parallel architecture.",
        "Loads the current rules, ownership boundaries, and project truth before edits."
      ],
      works: [
        "Codex reads startup instructions, doctrine, system maps, decisions, and the active queue before touching files.",
        "Those documents tell Codex what owns the behavior, what files are generated, and what validation is required."
      ],
      proof: [
        "Proof is the read order, referenced doctrine, and system-map entries used to scope the task."
      ],
      matters: [
        "This makes the repository control Codex. The prompt starts the work, but the project rules govern it."
      ],
      files: [
        "AGENTS.md",
        "Packages/FoundationSeed/Documentation~/Doctrine/",
        "_Plant/Doctrine/",
        "_Plant/SystemMap/"
      ]
    },
    "scoped-code-changes": {
      stepLabel: "04 Workflow step",
      badge: "Change",
      takeaway: "Only owned files move.",
      artifact: {
        type: "diff",
        label: "Bounded file change",
        columns: [
          {
            title: "Changed",
            items: ["Runtime capability owner", "Shared data types", "Editor validation helper", "Focused edit-mode tests"]
          },
          {
            title: "Protected",
            items: ["Generated assets", "unrelated locomotion systems", "scene output", "legacy prototype code"]
          }
        ]
      },
      solves: [
        "Avoids broad rewrites and duplicate systems.",
        "Keeps changes in the files that actually own the behavior."
      ],
      works: [
        "Codex checks existing owners and extension points before adding new code.",
        "If output is generated, Codex changes authored source, sync tools, factories, or generators rather than fragile generated files."
      ],
      proof: [
        "Proof is a focused file diff that matches the declared owner and does not touch unrelated systems."
      ],
      matters: [
        "Scoped changes are what make AI edits maintainable in a real project instead of impressive but risky patches."
      ],
      files: [
        "Assets/Plant/Runtime/",
        "Assets/Plant/Editor/",
        "Assets/Plant/Authoring/",
        "Generated file boundaries"
      ]
    },
    "validation": {
      stepLabel: "05 Workflow step",
      badge: "Check",
      takeaway: "Done means checked.",
      artifact: {
        type: "checklist",
        label: "Validation result",
        items: [
          { text: "Runtime compile: passed", status: "passed" },
          { text: "Editor/test compile: passed", status: "passed" },
          { text: "Queue JSON parse: passed", status: "passed" },
          { text: "Focused stale scan: clean", status: "passed" },
          { text: "Unity play-mode review: manual handoff when editor access is required", status: "blocked" }
        ]
      },
      solves: [
        "Stops clean-looking output from being accepted without evidence.",
        "Matches the check type to the risk of the change."
      ],
      works: [
        "Code changes get compile or static checks. Data changes get parser checks. Runtime changes use logs. Visual/UI work needs render or screenshot review when available.",
        "Blocked validation is recorded honestly with the exact reason."
      ],
      proof: [
        "Proof is command output, parsed reports, screenshots, logs, or a documented human validation handoff."
      ],
      matters: [
        "Validation makes AI work accountable. It proves whether the change survived contact with the project."
      ],
      files: [
        "Build/test output",
        "_Plant/Logs/",
        "Generated validation reports",
        "Runtime/editor verification notes"
      ]
    },
    "evidence-log": {
      stepLabel: "06 Workflow step",
      badge: "Record",
      takeaway: "Proof survives the session.",
      artifact: {
        type: "log",
        label: "Recorded proof",
        fields: [
          { label: "queueItem", value: "Q-20260515-320" },
          { label: "changedArtifacts", value: "CapabilityOwner.cs, CapabilityTypes.cs, CapabilityValidationTests.cs" },
          { label: "validation", value: "runtime compile passed, editor tests passed, stale scan clean" },
          { label: "report", value: "_Plant/SystemMap/CapabilityRefactorReport.md" }
        ]
      },
      solves: [
        "Prevents completed work from disappearing into chat history.",
        "Records what changed, what passed, and what remains blocked."
      ],
      works: [
        "After validation, Codex writes evidence into the execution log with the queue item id, touched artifacts, and validation results.",
        "The log becomes searchable proof for future sessions."
      ],
      proof: [
        "Proof is the JSONL execution-log record for the closed queue item."
      ],
      matters: [
        "Evidence logs let someone audit the workflow without trusting memory or reading an entire chat transcript."
      ],
      files: [
        "_Plant/Doctrine/Queue/PromptExecutionLog.jsonl",
        "_Plant/SystemMap/*Report.md"
      ]
    },
    "docs-updated": {
      stepLabel: "07 Workflow step",
      badge: "Memory",
      takeaway: "The repo remembers.",
      artifact: {
        type: "compare",
        label: "Project memory update",
        columns: [
          {
            title: "Before",
            items: ["Lab fixture placement was treated as visual layout only.", "The rule lived in the moment of feedback."]
          },
          {
            title: "After",
            items: ["Fixture approach-side rule documented.", "Player-facing operator side aligns terminal, keyboard, scanner, and access lane."]
          }
        ]
      },
      solves: [
        "Keeps architecture notes from drifting behind the implementation.",
        "Preserves new rules and ownership changes for the next Codex session."
      ],
      works: [
        "When work changes project truth, Codex updates system maps, doctrine, decisions, or prompt memory in the same pass.",
        "Documentation is treated as part of the deliverable, not an optional afterthought."
      ],
      proof: [
        "Proof is a matching system-map, doctrine, decision, or queue-memory update tied to the implementation."
      ],
      matters: [
        "This is how the repo gets smarter. The next session starts with better context than the last one had."
      ],
      files: [
        "_Plant/SystemMap/SystemMapIndex.md",
        "_Plant/SystemMap/ProjectSystemMap.md",
        "_Plant/Doctrine/Decisions/",
        "_Plant/Doctrine/Queue/PromptMemory.json"
      ]
    },
    "next-queue-item": {
      stepLabel: "08 Workflow step",
      badge: "Handoff",
      takeaway: "AI stops; the human decides what runs next.",
      artifact: {
        type: "handoff",
        label: "Controlled handoff",
        items: [
          { text: "Queued", status: "done" },
          { text: "Active", status: "done" },
          { text: "Implemented", status: "done" },
          { text: "Validated", status: "done" },
          { text: "Logged", status: "done" },
          { text: "Closed", status: "done" },
          { text: "Next item awaits explicit assignment", status: "next" }
        ],
        note: "Next item awaits explicit assignment"
      },
      solves: [
        "Prevents Codex from automatically drifting into unrelated work.",
        "Keeps the human in control of what runs next."
      ],
      works: [
        "After the assigned item closes, Codex stops. The next item starts only when the human explicitly assigns it or asks to drain the queue.",
        "That protects multi-agent work, scope boundaries, and review discipline."
      ],
      proof: [
        "Proof is the active queue state after completion and the explicit assignment for any next item."
      ],
      matters: [
        "The workflow stays deliberate. AI can move quickly, but it does not get to choose the next priority on its own."
      ],
      files: [
        "_Plant/Doctrine/Queue/ActivePromptQueue.json",
        "_Plant/Doctrine/QueueDoctrine.md",
        "PromptExecutionLog.jsonl"
      ]
    }
  };

  const workflowMap = document.getElementById("aiWorkflowMap");
  const modal = document.getElementById("aiSystemModal");
  const closeButton = document.getElementById("aiSystemModalClose");
  const label = document.getElementById("aiSystemModalLabel");
  const title = document.getElementById("aiSystemModalTitle");
  const badge = document.getElementById("aiSystemModalBadge");
  const subtitle = document.getElementById("aiSystemModalSubtitle");
  const takeaway = document.getElementById("aiSystemModalTakeaway");
  const artifactLabel = document.getElementById("aiSystemArtifactLabel");
  const artifact = document.getElementById("aiSystemArtifact");
  const solves = document.getElementById("aiSystemSolves");
  const works = document.getElementById("aiSystemWorks");
  const matters = document.getElementById("aiSystemMatters");
  const files = document.getElementById("aiSystemFiles");
  const previousButton = document.getElementById("aiSystemModalPrev");
  const nextButton = document.getElementById("aiSystemModalNext");
  let activeSystem = null;
  let lockedScrollY = 0;

  function clearNode(node) {
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  function setParagraphs(node, paragraphs) {
    clearNode(node);
    paragraphs.forEach(function (text) {
      const paragraph = document.createElement("p");
      paragraph.textContent = text;
      node.appendChild(paragraph);
    });
  }

  function setFiles(items) {
    clearNode(files);
    items.forEach(function (text) {
      const item = document.createElement("li");
      item.textContent = text;
      files.appendChild(item);
    });
  }

  function addArtifactLine(parent, text, className) {
    const line = document.createElement("p");
    if (className) {
      line.className = className;
    }
    line.textContent = text;
    parent.appendChild(line);
    return line;
  }

  function renderArtifact(details) {
    clearNode(artifact);
    artifact.className = "ai-artifact ai-artifact-" + details.artifact.type;
    artifactLabel.textContent = details.artifact.label;

    if (details.artifact.type === "quote") {
      const quote = document.createElement("blockquote");
      quote.textContent = '"' + details.artifact.quote + '"';
      artifact.appendChild(quote);

      const normalized = document.createElement("div");
      normalized.className = "ai-artifact-normalized";
      addArtifactLine(normalized, "Normalized intent", "ai-artifact-kicker");
      addArtifactLine(normalized, details.artifact.normalized);
      artifact.appendChild(normalized);

      const tags = document.createElement("div");
      tags.className = "ai-artifact-tags";
      details.artifact.tags.forEach(function (tag) {
        const item = document.createElement("span");
        item.textContent = tag;
        tags.appendChild(item);
      });
      artifact.appendChild(tags);
      return;
    }

    if (details.artifact.type === "task" || details.artifact.type === "log") {
      if (details.artifact.fields) {
        const grid = document.createElement("div");
        grid.className = details.artifact.type === "task" ? "ai-artifact-field-grid" : "ai-artifact-proof-summary";
        details.artifact.fields.forEach(function (field) {
          const item = document.createElement("div");
          const fieldLabel = document.createElement("span");
          const fieldValue = document.createElement("strong");
          fieldLabel.textContent = field.label;
          fieldValue.textContent = field.value;
          item.appendChild(fieldLabel);
          item.appendChild(fieldValue);
          grid.appendChild(item);
        });
        artifact.appendChild(grid);
        return;
      }

      const code = document.createElement("pre");
      code.textContent = details.artifact.text;
      artifact.appendChild(code);
      return;
    }

    if (details.artifact.type === "stack" || details.artifact.type === "checklist" || details.artifact.type === "handoff") {
      const list = document.createElement("ol");
      if (details.artifact.type === "checklist") {
        list.className = "ai-artifact-checklist";
      }
      details.artifact.items.forEach(function (item) {
        const li = document.createElement("li");
        if (typeof item === "string") {
          li.textContent = item;
        } else {
          li.textContent = item.text;
          li.dataset.status = item.status;
        }
        list.appendChild(li);
      });
      artifact.appendChild(list);
      if (details.artifact.note) {
        const note = document.createElement("p");
        note.className = "ai-artifact-handoff-note";
        note.textContent = details.artifact.note;
        artifact.appendChild(note);
      }
      return;
    }

    if (details.artifact.type === "compare" || details.artifact.type === "diff") {
      const grid = document.createElement("div");
      grid.className = "ai-artifact-columns";
      details.artifact.columns.forEach(function (column) {
        const panel = document.createElement("div");
        addArtifactLine(panel, column.title, "ai-artifact-kicker");
        column.items.forEach(function (item) {
          addArtifactLine(panel, item);
        });
        grid.appendChild(panel);
      });
      artifact.appendChild(grid);
    }
  }

  function setScrollLock(locked) {
    document.documentElement.classList.toggle("modal-open", locked);
    document.body.classList.toggle("modal-open", locked);

    if (locked) {
      lockedScrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = "-" + lockedScrollY + "px";
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.width = "100%";
    } else {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.width = "";
      window.scrollTo(0, lockedScrollY);
    }
  }

  function openSystem(systemId) {
    const system = workflowSteps.find(function (item) {
      return item.id === systemId;
    });

    if (!system) {
      return;
    }

    const shouldLockScroll = modal.hidden;
    activeSystem = system;
    const details = workflowDetails[system.id];
    label.textContent = details.stepLabel;
    title.textContent = system.title;
    subtitle.textContent = system.subtitle;
    badge.textContent = details.badge;
    takeaway.textContent = details.takeaway || "";
    renderArtifact(details);
    setParagraphs(solves, details.solves);
    setParagraphs(works, details.works);
    setParagraphs(matters, details.matters);
    setFiles(details.files);
    updateModalNavigation(system.id);
    modal.hidden = false;
    modal.scrollTop = 0;
    if (shouldLockScroll) {
      setScrollLock(true);
    }
  }

  function updateModalNavigation(systemId) {
    const currentIndex = workflowSteps.findIndex(function (item) {
      return item.id === systemId;
    });
    const previous = workflowSteps[currentIndex - 1];
    const next = workflowSteps[currentIndex + 1];

    previousButton.disabled = !previous;
    nextButton.disabled = !next;
    previousButton.textContent = previous ? "Previous: " + previous.title : "Previous step";
    nextButton.textContent = next ? "Next: " + next.title : "Next step";
    previousButton.dataset.target = previous ? previous.id : "";
    nextButton.dataset.target = next ? next.id : "";
  }

  function closeModal() {
    modal.hidden = true;
    activeSystem = null;
    setScrollLock(false);
  }

  function iconMarkup(index) {
    const icons = [
      '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="21" r="11"></circle><path d="M17 53c0-12 6-20 15-20s15 8 15 20z"></path></svg>',
      '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="18" y="15" width="28" height="40" rx="4"></rect><path d="M25 15h14l-2-5H27zM25 28h14M25 37h14M25 46h10"></path></svg>',
      '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M12 20c8-4 15-4 20 0v31c-5-4-12-4-20 0zM32 20c5-4 12-4 20 0v31c-8-4-15-4-20 0z"></path><path d="M43 28c4 0 7 3 7 7 0 6-7 12-7 12s-7-6-7-12c0-4 3-7 7-7z"></path><circle cx="43" cy="35" r="2"></circle></svg>',
      '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="13" y="17" width="38" height="32" rx="4"></rect><path d="M13 27h38M25 36l-7 6 7 6M39 36l7 6-7 6M35 34l-6 16"></path></svg>',
      '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 8l20 9v13c0 13-8 22-20 27-12-5-20-14-20-27V17z"></path><path d="M22 32l7 7 14-16"></path></svg>',
      '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M20 10h21l9 9v35H20zM41 10v10h9M27 29h14M27 38h10"></path><circle cx="44" cy="45" r="9"></circle><path d="M40 45l3 3 6-7"></path></svg>',
      '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M20 10h21l9 9v35H20zM41 10v10h9M27 29h13M27 38h9"></path><path d="M37 50l14-14 5 5-14 14-7 2z"></path></svg>',
      '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M44 20a20 20 0 1 0 3 25"></path><path d="M39 32h17M49 24l7 8-7 8"></path></svg>'
    ];
    return icons[index] || icons[0];
  }

  function renderWorkflowMap() {
    clearNode(workflowMap);
    workflowSteps.forEach(function (system, index) {
      const button = document.createElement("button");
      button.className = "ai-workflow-step";
      button.type = "button";
      button.dataset.systemId = system.id;
      button.setAttribute("aria-label", "Open " + system.title + " details");

      const icon = document.createElement("span");
      icon.className = "ai-workflow-icon";
      icon.innerHTML = iconMarkup(index);

      const number = document.createElement("span");
      number.className = "ai-workflow-number";
      number.textContent = String(index + 1).padStart(2, "0");
      number.setAttribute("aria-hidden", "true");

      const text = document.createElement("span");
      text.className = "ai-workflow-step-title";
      text.textContent = system.title;

      button.appendChild(number);
      button.appendChild(icon);
      button.appendChild(text);
      workflowMap.appendChild(button);

    });
  }

  renderWorkflowMap();

  workflowMap.addEventListener("click", function (event) {
    const trigger = event.target instanceof Element ? event.target.closest("[data-system-id]") : null;
    if (trigger) {
      openSystem(trigger.dataset.systemId);
    }
  });

  closeButton.addEventListener("click", closeModal);

  [previousButton, nextButton].forEach(function (button) {
    button.addEventListener("click", function () {
      if (button.dataset.target) {
        openSystem(button.dataset.target);
      }
    });
  });

  modal.addEventListener("click", function (event) {
    const closeTarget = event.target instanceof Element ? event.target.closest("[data-ai-modal-close='true']") : null;
    if (closeTarget) {
      closeModal();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !modal.hidden) {
      closeModal();
    }
  });
})();

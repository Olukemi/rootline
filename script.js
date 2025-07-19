let familyData = [];

const form = document.getElementById('member-form');
const nameInput = document.getElementById('name');
const parentInput = document.getElementById('parent');
const treeDisplay = document.getElementById('tree-display');
const downloadBtn = document.getElementById('download-btn');
const uploadInput = document.getElementById('upload');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = nameInput.value.trim();
  const parent = parentInput.value.trim();

  if (!name) return;

  // Check if member already exists
  const existingMember = familyData.find(m => m.name === name);

  if (existingMember) {
    // Update parent if provided
    if (parent && existingMember.parent !== parent) {
      existingMember.parent = parent;
    }
  } else {
    // Add new member
    familyData.push({ name, parent });
  }

  nameInput.value = '';
  parentInput.value = '';
  renderTree();
});

function renderTree() {
  treeDisplay.innerHTML = '';
  familyData.forEach(member => {
    const div = document.createElement('div');
    div.className = 'member';
    div.textContent = `${member.name} ${member.parent ? `(child of ${member.parent})` : ''}`;
    treeDisplay.appendChild(div);
  });

  renderGraph();
}

function renderGraph() {
  const cy = cytoscape({
    container: document.getElementById('cy'),
    elements: [],
    layout: {
      name: 'breadthfirst',
      directed: true,
      padding: 10
    },
    style: [
      {
        selector: 'node',
        style: {
          'label': 'data(id)',
          'background-color': '#61bffc',
          'text-valign': 'center',
          'color': '#000',
          'text-outline-width': 1,
          'text-outline-color': '#fff'
        }
      },
      {
        selector: 'edge',
        style: {
          'width': 2,
          'line-color': '#ccc',
          'target-arrow-color': '#ccc',
          'target-arrow-shape': 'triangle'
        }
      }
    ]
  });

  const namesSet = new Set();

  // Add all nodes
  familyData.forEach(person => {
    if (!namesSet.has(person.name)) {
      cy.add({ group: 'nodes', data: { id: person.name } });
      namesSet.add(person.name);
    }

    if (person.parent && !namesSet.has(person.parent)) {
      cy.add({ group: 'nodes', data: { id: person.parent } });
      namesSet.add(person.parent);
    }

    if (person.parent) {
      cy.add({ group: 'edges', data: { source: person.parent, target: person.name } });
    }
  });

  cy.layout({ name: 'breadthfirst', directed: true, padding: 10 }).run();
}

downloadBtn.addEventListener('click', () => {
  const csv = Papa.unparse(familyData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'family-tree.csv';
  a.click();
  URL.revokeObjectURL(url);
});

uploadInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  Papa.parse(file, {
    header: true,
    complete: function(results) {
      familyData = [];
      const newData = results.data.filter(row => row.name);

      newData.forEach(uploaded => {
        const existing = familyData.find(m => m.name === uploaded.name);
        if (existing) {
          existing.parent = uploaded.parent || existing.parent;
        } else {
          familyData.push({ name: uploaded.name, parent: uploaded.parent });
        }
      });

      familyData = newData;
      renderTree();
    }
  });
});
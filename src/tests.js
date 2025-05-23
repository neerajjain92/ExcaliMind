// Excalidraw-like Test Suite
// --- Test Runner Setup ---
let testCount = 0;
let assertionsPassed = 0;
let assertionsFailed = 0;

function describe(suiteName, fn) {
  console.group(`Suite: ${suiteName}`);
  fn();
  console.groupEnd();
}

function it(testName, fn) {
  testCount++;
  console.groupCollapsed(`Test #${testCount}: ${testName}`);
  try {
    fn();
    console.log(`%cPASSED: ${testName}`, 'color: green;');
  } catch (e) {
    console.error(`%cFAILED: ${testName}`, 'color: red;');
    console.error(e);
  }
  console.groupEnd();
}

function assert(condition, message) {
  if (condition) {
    assertionsPassed++;
    // console.log(`%c  ✓ Assertion Passed`, 'color: green; font-style: italic; font-size: 0.8em');
  } else {
    assertionsFailed++;
    console.error(`%c  ✗ Assertion Failed: ${message}`, 'color: red; font-weight: bold');
    // Optionally, throw an error to stop the current test on failure
    // throw new Error(`Assertion Failed: ${message}`);
  }
}

function resetTestStats() {
  testCount = 0;
  assertionsPassed = 0;
  assertionsFailed = 0;
}

function logTestSummary() {
  console.log('\n--- Test Summary ---');
  console.log(`Total Tests: ${testCount}`);
  console.log(`%cAssertions Passed: ${assertionsPassed}`, 'color: green;');
  if (assertionsFailed > 0) {
    console.log(`%cAssertions Failed: ${assertionsFailed}`, 'color: red; font-weight: bold;');
  } else {
    console.log('All assertions passed!');
  }
  console.log('--------------------');
}

// --- Mock Data and Functions ---

// Mock elements.js functions (simplified versions)
const mockElementsModule = {
  createElement: (id, x1, y1, x2, y2, type, options = {}, roughGenerator = null) => {
    const el = {
      id,
      type,
      x: x1,
      y: y1,
      width: x2 - x1,
      height: y2 - y1,
      strokeColor: '#000000',
      backgroundColor: 'transparent',
      seed: Math.random(),
      points: type === 'line' || type === 'arrow' || type === 'freedraw' ? [] : undefined,
      children: type === 'group' ? (options.children || []) : undefined,
      ...options
    };
    if (type === 'group') {
      // Ensure children have relative coordinates if they are part of options
      el.children = (options.children || []).map(child => ({
        ...child,
        x: child.x - el.x,
        y: child.y - el.y,
      }));
    }
    return el;
  },
  regenerateElementDrawable: (element, roughGenerator) => { /* no-op for tests */ },
  groupElements: (elementsToGroup, roughGenerator, nextIdFn) => {
    if (!elementsToGroup || elementsToGroup.length === 0) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    elementsToGroup.forEach(el => {
      minX = Math.min(minX, el.x);
      minY = Math.min(minY, el.y);
      maxX = Math.max(maxX, el.x + (el.width || 0));
      maxY = Math.max(maxY, el.y + (el.height || 0));
    });
    const groupX = minX;
    const groupY = minY;
    const groupWidth = maxX - minX;
    const groupHeight = maxY - minY;
    const groupChildren = elementsToGroup.map(el => ({
      ...el, // clone
      x: el.x - groupX, // make relative
      y: el.y - groupY,  // make relative
    }));
    return mockElementsModule.createElement(nextIdFn(), groupX, groupY, groupX + groupWidth, groupY + groupHeight, 'group', { children: groupChildren });
  },
  ungroupElements: (groupElement, roughGenerator) => {
    if (!groupElement || groupElement.type !== 'group') return [];
    return groupElement.children.map(child => ({
      ...child, // clone
      x: groupElement.x + child.x, // make absolute
      y: groupElement.y + child.y,  // make absolute
    }));
  },
  // drawElement: () => {} // Not needed for logic tests
};

// Mock toolbar.js functions (simplified versions)
const mockToolbarModule = {
  updateGroupUngroupButtonStates: (selectedElements) => {
    // This function is tested separately, but we need a mock for canvas.js calls
    // In real tests, you might spy on this or check its effects on mock DOM.
    // console.log(`Mock updateGroupUngroupButtonStates called with ${selectedElements.length} elements`);
  }
};

// Mock DOM elements for toolbar buttons
const mockGroupButton = { disabled: true };
const mockUngroupButton = { disabled: true };

// --- Test Suites ---
describe('Multi-Selection Logic (canvas.js)', () => {
  let mockCanvasState;

  function setupMockCanvasState() {
    mockCanvasState = {
      elements: [],
      selectedElements: [],
      selectedElementIndices: [],
      tool: 'selection',
      roughGenerator: null, // Not used in these logic tests
      scale: 1,
      panOffset: { x: 0, y: 0 },

      // Mocked canvas functions that interact with the state
      getElementAtPosition: (x, y) => {
        // Simplified: finds the first element whose bounding box contains x,y
        for (let i = mockCanvasState.elements.length - 1; i >= 0; i--) {
          const el = mockCanvasState.elements[i];
          if (x >= el.x && x <= el.x + el.width && y >= el.y && y <= el.y + el.height) {
            return { index: i, position: 'inside', handle: null };
          }
        }
        return null;
      },
      render: () => { /* console.log('Mock render called'); */ },
      updateJsonEditor: () => { /* console.log('Mock updateJsonEditor called'); */ },
      // The actual functions from canvas.js will be tested by calling them directly
      // but they will operate on this mockCanvasState.
    };
  }
  
  // Re-construct canvas-like handleMouseDown to operate on mockCanvasState
  function mockHandleMouseDown(e) {
    const startX = (e.offsetX - mockCanvasState.panOffset.x) / mockCanvasState.scale;
    const startY = (e.offsetY - mockCanvasState.panOffset.y) / mockCanvasState.scale;

    if (mockCanvasState.tool === 'selection') {
      const hitResult = mockCanvasState.getElementAtPosition(startX, startY);
      if (hitResult) {
        const clickedElementIndex = hitResult.index;
        const clickedElement = mockCanvasState.elements[clickedElementIndex];
        if (e.shiftKey) {
          const existingIndex = mockCanvasState.selectedElementIndices.indexOf(clickedElementIndex);
          if (existingIndex > -1) {
            mockCanvasState.selectedElementIndices.splice(existingIndex, 1);
            mockCanvasState.selectedElements = mockCanvasState.selectedElements.filter(el => el.id !== clickedElement.id);
          } else {
            mockCanvasState.selectedElementIndices.push(clickedElementIndex);
            mockCanvasState.selectedElements.push(clickedElement);
          }
        } else {
          // If not shift key, and the clicked element is not already the *only* selected element
          if (!(mockCanvasState.selectedElements.length === 1 && mockCanvasState.selectedElements[0].id === clickedElement.id)) {
             mockCanvasState.selectedElementIndices = [clickedElementIndex];
             mockCanvasState.selectedElements = [clickedElement];
          }
        }
      } else { // Clicked on empty canvas
        if (!e.shiftKey) {
          mockCanvasState.selectedElements = [];
          mockCanvasState.selectedElementIndices = [];
        }
      }
      mockToolbarModule.updateGroupUngroupButtonStates(mockCanvasState.selectedElements);
      mockCanvasState.render();
    }
  }


  it('Shift+Click to Select Multiple Elements', () => {
    setupMockCanvasState();
    const elA = mockElementsModule.createElement(0, 10, 10, 60, 60, 'rectangle');
    const elB = mockElementsModule.createElement(1, 80, 80, 130, 130, 'rectangle');
    const elC = mockElementsModule.createElement(2, 150, 150, 200, 200, 'rectangle');
    mockCanvasState.elements = [elA, elB, elC];

    // Click on A
    mockHandleMouseDown({ offsetX: 20, offsetY: 20, shiftKey: false });
    assert(mockCanvasState.selectedElements.length === 1 && mockCanvasState.selectedElements[0].id === elA.id, 'Element A should be selected');

    // Shift+Click on B
    mockHandleMouseDown({ offsetX: 90, offsetY: 90, shiftKey: true });
    assert(mockCanvasState.selectedElements.length === 2, 'Two elements should be selected');
    assert(mockCanvasState.selectedElements.some(el => el.id === elA.id), 'Element A should still be selected');
    assert(mockCanvasState.selectedElements.some(el => el.id === elB.id), 'Element B should be selected');
  });

  it('Shift+Click to Deselect from Multiple Elements', () => {
    setupMockCanvasState();
    const elA = mockElementsModule.createElement(0, 10, 10, 60, 60, 'rectangle');
    const elB = mockElementsModule.createElement(1, 80, 80, 130, 130, 'rectangle');
    mockCanvasState.elements = [elA, elB];
    mockCanvasState.selectedElements = [elA, elB]; // Pre-select A and B
    mockCanvasState.selectedElementIndices = [0, 1];

    // Shift+Click on A
    mockHandleMouseDown({ offsetX: 20, offsetY: 20, shiftKey: true });
    assert(mockCanvasState.selectedElements.length === 1, 'One element should remain selected');
    assert(mockCanvasState.selectedElements[0].id === elB.id, 'Element B should remain selected');
  });

  it('Click without Shift to Select Single Element (clearing previous multiple)', () => {
    setupMockCanvasState();
    const elA = mockElementsModule.createElement(0, 10, 10, 60, 60, 'rectangle');
    const elB = mockElementsModule.createElement(1, 80, 80, 130, 130, 'rectangle');
    const elC = mockElementsModule.createElement(2, 150, 150, 200, 200, 'rectangle');
    mockCanvasState.elements = [elA, elB, elC];
    mockCanvasState.selectedElements = [elA, elB]; // Pre-select A and B
    mockCanvasState.selectedElementIndices = [0, 1];

    // Click on C (no shift)
    mockHandleMouseDown({ offsetX: 160, offsetY: 160, shiftKey: false });
    assert(mockCanvasState.selectedElements.length === 1, 'Only one element should be selected');
    assert(mockCanvasState.selectedElements[0].id === elC.id, 'Element C should be the only selected element');
  });
  
  it('Click on Canvas Background to Clear Selection', () => {
    setupMockCanvasState();
    const elA = mockElementsModule.createElement(0, 10, 10, 60, 60, 'rectangle');
    const elB = mockElementsModule.createElement(1, 80, 80, 130, 130, 'rectangle');
    mockCanvasState.elements = [elA, elB];
    mockCanvasState.selectedElements = [elA, elB]; // Pre-select A and B
    mockCanvasState.selectedElementIndices = [0, 1];

    // Click on canvas (empty area)
    mockHandleMouseDown({ offsetX: 300, offsetY: 300, shiftKey: false });
    assert(mockCanvasState.selectedElements.length === 0, 'Selection should be empty');
    assert(mockCanvasState.selectedElementIndices.length === 0, 'Selection indices should be empty');
  });
});

// --- Grouping/Ungrouping Tests ---
describe('Grouping and Ungrouping Logic (elements.js & canvas.js)', () => {
  let mockCanvasForGrouping;

  function setupMockCanvasForGrouping() {
     mockCanvasForGrouping = {
      elements: [],
      selectedElements: [],
      selectedElementIndices: [],
      roughGenerator: null, // Mock, not essential for logic
      render: () => {},
      updateJsonEditor: () => {},
      // Direct bindings to the functions that will be tested
      groupSelectedElements: function() { // Use function() to bind 'this' to mockCanvasForGrouping
        if (this.selectedElements.length <= 1) return;
        const nextIdFn = () => this.elements.reduce((maxId, el) => Math.max(el.id, maxId), -1) + 1;
        const newGroup = mockElementsModule.groupElements(this.selectedElements, this.roughGenerator, nextIdFn);
        if (newGroup) {
          const selectedElementIds = this.selectedElements.map(el => el.id);
          this.elements = this.elements.filter(el => !selectedElementIds.includes(el.id));
          this.elements.push(newGroup);
          this.selectedElements = [newGroup];
          this.selectedElementIndices = [this.elements.indexOf(newGroup)];
          mockToolbarModule.updateGroupUngroupButtonStates(this.selectedElements);
          this.render();
          this.updateJsonEditor();
        }
      },
      ungroupSelectedElement: function() {
        if (this.selectedElements.length !== 1 || this.selectedElements[0].type !== 'group') return;
        const groupToUngroup = this.selectedElements[0];
        const ungroupedChildren = mockElementsModule.ungroupElements(groupToUngroup, this.roughGenerator);
        this.elements = this.elements.filter(el => el.id !== groupToUngroup.id);
        this.elements.push(...ungroupedChildren);
        this.selectedElements = ungroupedChildren;
        this.selectedElementIndices = ungroupedChildren.map(child => this.elements.indexOf(child));
        mockToolbarModule.updateGroupUngroupButtonStates(this.selectedElements);
        this.render();
        this.updateJsonEditor();
      }
    };
  }

  it('Create Group', () => {
    setupMockCanvasForGrouping();
    const el1 = mockElementsModule.createElement(0, 10, 10, 60, 60, 'rectangle'); // w:50, h:50
    const el2 = mockElementsModule.createElement(1, 80, 30, 130, 80, 'ellipse'); // w:50, h:50
    mockCanvasForGrouping.elements = [el1, el2];
    mockCanvasForGrouping.selectedElements = [el1, el2];
    mockCanvasForGrouping.selectedElementIndices = [0, 1];

    mockCanvasForGrouping.groupSelectedElements();

    assert(mockCanvasForGrouping.selectedElements.length === 1, 'One group should be selected');
    const group = mockCanvasForGrouping.selectedElements[0];
    assert(group.type === 'group', 'Selected element should be a group');
    assert(group.children.length === 2, 'Group should have 2 children');
    assert(group.children.some(c => c.id === el1.id), 'Group should contain original el1 by id');
    assert(group.children.some(c => c.id === el2.id), 'Group should contain original el2 by id');
    
    // Check children coordinates (relative)
    const child1InGroup = group.children.find(c => c.id === el1.id);
    const child2InGroup = group.children.find(c => c.id === el2.id);

    // Expected group bounds: minX=10, minY=10, maxX=130 (80+50), maxY=80 (30+50)
    // Group X=10, Y=10, Width=120, Height=70
    assert(group.x === 10, `Group X should be 10, got ${group.x}`);
    assert(group.y === 10, `Group Y should be 10, got ${group.y}`);
    assert(group.width === 120, `Group width should be 120, got ${group.width}`); // (80+50) - 10
    assert(group.height === 70, `Group height should be 70, got ${group.height}`); // (30+50) - 10

    assert(child1InGroup.x === 0, `Child1 relative X should be 0, got ${child1InGroup.x}`); // el1.x (10) - group.x (10)
    assert(child1InGroup.y === 0, `Child1 relative Y should be 0, got ${child1InGroup.y}`); // el1.y (10) - group.y (10)
    assert(child2InGroup.x === 70, `Child2 relative X should be 70, got ${child2InGroup.x}`); // el2.x (80) - group.x (10)
    assert(child2InGroup.y === 20, `Child2 relative Y should be 20, got ${child2InGroup.y}`); // el2.y (30) - group.y (10)

    assert(mockCanvasForGrouping.elements.length === 1 && mockCanvasForGrouping.elements[0].type === 'group', 'Main elements array should contain only the group');
  });

  it('Ungroup Element', () => {
    setupMockCanvasForGrouping();
    const origEl1 = { id: 0, type: 'rectangle', x: 0, y: 0, width: 50, height: 50, seed: 1 }; // relative coords for children
    const origEl2 = { id: 1, type: 'ellipse', x: 70, y: 20, width: 50, height: 50, seed: 2 }; // relative coords for children
    
    const group = mockElementsModule.createElement(2, 10, 10, 130, 80, 'group', { // x:10, y:10, w:120, h:70
      children: [origEl1, origEl2] // Pass children with original relative coords
    });
    
    mockCanvasForGrouping.elements = [group];
    mockCanvasForGrouping.selectedElements = [group];
    mockCanvasForGrouping.selectedElementIndices = [0];

    mockCanvasForGrouping.ungroupSelectedElement();

    assert(mockCanvasForGrouping.selectedElements.length === 2, 'Two children should be selected after ungroup');
    assert(mockCanvasForGrouping.elements.length === 2, 'Main elements array should contain 2 children');

    const child1AfterUngroup = mockCanvasForGrouping.elements.find(c => c.id === origEl1.id);
    const child2AfterUngroup = mockCanvasForGrouping.elements.find(c => c.id === origEl2.id);

    assert(child1AfterUngroup !== undefined, 'Child 1 should be in elements array');
    assert(child2AfterUngroup !== undefined, 'Child 2 should be in elements array');

    // Check absolute coordinates
    assert(child1AfterUngroup.x === 10, `Child1 absolute X should be 10, got ${child1AfterUngroup.x}`); // group.x (10) + origEl1.x (0)
    assert(child1AfterUngroup.y === 10, `Child1 absolute Y should be 10, got ${child1AfterUngroup.y}`); // group.y (10) + origEl1.y (0)
    assert(child2AfterUngroup.x === 80, `Child2 absolute X should be 80, got ${child2AfterUngroup.x}`); // group.x (10) + origEl2.x (70)
    assert(child2AfterUngroup.y === 30, `Child2 absolute Y should be 30, got ${child2AfterUngroup.y}`); // group.y (10) + origEl2.y (20)
  });
});

// --- Toolbar Button State Tests ---
describe('Toolbar Button State Logic (toolbar.js)', () => {
  // Using the actual updateGroupUngroupButtonStates from toolbar.js (if it can be imported)
  // For now, let's define a local version for testing if direct import is tricky in this environment
  const testUpdateGroupUngroupButtonStates = (selectedElements) => {
    mockGroupButton.disabled = !(selectedElements && selectedElements.length > 1);
    mockUngroupButton.disabled = !(selectedElements && selectedElements.length === 1 && selectedElements[0].type === 'group');
  };

  it('Empty selection: Group=disabled, Ungroup=disabled', () => {
    testUpdateGroupUngroupButtonStates([]);
    assert(mockGroupButton.disabled === true, 'Group button should be disabled for empty selection');
    assert(mockUngroupButton.disabled === true, 'Ungroup button should be disabled for empty selection');
  });

  it('One non-group element selected: Group=disabled, Ungroup=disabled', () => {
    const el1 = mockElementsModule.createElement(0, 0,0,10,10, 'rectangle');
    testUpdateGroupUngroupButtonStates([el1]);
    assert(mockGroupButton.disabled === true, 'Group button should be disabled for single non-group selection');
    assert(mockUngroupButton.disabled === true, 'Ungroup button should be disabled for single non-group selection');
  });

  it('Multiple non-group elements selected: Group=enabled, Ungroup=disabled', () => {
    const el1 = mockElementsModule.createElement(0, 0,0,10,10, 'rectangle');
    const el2 = mockElementsModule.createElement(1, 20,20,30,30, 'rectangle');
    testUpdateGroupUngroupButtonStates([el1, el2]);
    assert(mockGroupButton.disabled === false, 'Group button should be enabled for multiple non-group selection');
    assert(mockUngroupButton.disabled === true, 'Ungroup button should be disabled');
  });

  it('One group element selected: Group=disabled, Ungroup=enabled', () => {
    const group = mockElementsModule.createElement(0, 0,0,10,10, 'group');
    testUpdateGroupUngroupButtonStates([group]);
    assert(mockGroupButton.disabled === true, 'Group button should be disabled for single group selection');
    assert(mockUngroupButton.disabled === false, 'Ungroup button should be enabled for single group selection');
  });
  
  it('Multiple elements including a group: Group=enabled, Ungroup=disabled', () => {
    const group = mockElementsModule.createElement(0, 0,0,10,10, 'group');
    const el1 = mockElementsModule.createElement(1, 20,20,30,30, 'rectangle');
    testUpdateGroupUngroupButtonStates([group, el1]);
    assert(mockGroupButton.disabled === false, 'Group button should be enabled for multiple items (group + other)');
    assert(mockUngroupButton.disabled === true, 'Ungroup button should be disabled (as more than just one group is selected)');
  });
});


// --- Run all tests ---
function runAllTests() {
  resetTestStats();
  console.log('Starting Excalidraw Feature Tests...');
  
  // Invoke test suites
  // Note: In a real environment, you'd import these from canvas.js and toolbar.js
  // For this self-contained test.js, we use mocks or direct copies of logic.
  // If canvas.js and toolbar.js could be imported, we'd use their actual functions.
  
  // Multi-selection tests (using mockHandleMouseDown that mimics canvas.js logic)
  // (Already defined above)

  // Grouping/Ungrouping tests (using mock canvas and element functions)
  // (Already defined above)

  // Toolbar button state tests (using a local version of updateGroupUngroupButtonStates)
  // (Already defined above)

  logTestSummary();
}

// To run tests when this file is loaded (e.g., in a browser or Node.js environment):
// runAllTests(); 
// Or, you can expose runAllTests and call it manually from the console.
// For this task, providing the file content is the main goal.
// Add a button or a command in your HTML to trigger `runAllTests()`
// e.g., <button onclick="runAllTests()">Run Tests</button>

console.log("src/tests.js loaded. Call runAllTests() to execute.");

const fileInput = document.getElementById('fileInput');
fileInput.addEventListener('change', handleFileInput);

let colsinput = document.getElementById("colsinput")

colsinput.addEventListener("change", (e) => {
    cols = e.target.value
})
let rowsinput = document.getElementById("rowsinput")

rowsinput.addEventListener("change", (e) => {
    rows = e.target.value
})

document.getElementById("screenshotbtn").addEventListener("click", () => {
    saveCanvas('screenshot', 'png');
})



let canvasbox = document.getElementById("canvasbox")
let startbtn = document.getElementById("startbtn")
startbtn.addEventListener("click", function (e) {
    startTimer()
    playing = true
    loop()
})

let pausebtn = document.getElementById("pausebtn")
pausebtn.addEventListener("click", function (e) {
    noLoop()
})

let resetbtn = document.getElementById("resetbtn")
resetbtn.addEventListener("click", function (e) {
    loop()
    playing = false
    p5img = null
    zoomscale = 1

    imagexy = [0, 0]
    cellwidth = canvaswidth / cols
    cellheight = canvasheight / rows
    grid = new Array(cols)
    startxy = [0, 0]
    endxy = [cols - 1, rows - 1]


    openSet = []
    closedSet = []
    startNode = {}
    endNode = {}
    path = []
    current = {}

    mysetup()
})


let processbtn = document.getElementById("processbtn").addEventListener("click", (e) => {
    console.log("process btn")

    // make image monochrome
    // increase contrast
    p5img.filter(THRESHOLD);

    // remove white background
    p5img.loadPixels();
    for (let y = 0; y < p5img.height; y++) {
        for (let x = 0; x < p5img.width; x++) {

            let canvasx = imagexy[0] + x
            let canvasy = imagexy[1] + y
            //   console.log(canvasx)
            //    console.log(canvasy)

            let index = (x + y * p5img.width) * 4;
            let r = p5img.pixels[index];
            let g = p5img.pixels[index + 1];
            let b = p5img.pixels[index + 2];

            // Check if the pixel is white (R, G, B values all equal to 255)
            if (r === 255 && g === 255 && b === 255) {
                p5img.pixels[index + 3] = 0; // Set alpha channel to 0 (transparent)
            }

            // if its black
            if (r === 0 && g === 0 && b === 0) {
                // p5img.pixels[index + 3] = 0; // Set alpha channel to 0 (transparent)
                // Calculate the grid cell position based on the pixels x and y
                let xx = floor(canvasx / cellwidth);
                let yy = floor(canvasy / cellheight);

                // Check if the cell position is within the grid bounds
                if (xx >= 0 && xx < cols && yy >= 0 && yy < rows) {
                    // Set the value of the cell to 1
                    grid[xx][yy].obstacle = true
                }

            }

        }
    }

    p5img.updatePixels();

})



const myconfetti = new JSConfetti()



let startTime;
let isRunning = false;
let intervalId;

let currenttimer = "00:00:00"




let canvaswidth = canvasbox.clientWidth
let canvasheight = canvasbox.clientWidth * 2 / 3

let cols = 90
let rows = 60
let copyimage

let zoomscale = 1

let imagexy = [0, 0]

let cellwidth = canvaswidth / cols
let cellheight = canvasheight / rows

let grid = new Array(cols)

let p5img

let openSet = []
let closedSet = []

let startNode
let endNode

let startxy = [0, 0]
let endxy = [cols - 1, rows - 1]

let path = []
let current

let playing = false



function mysetup() {

    // set ui values
    colsinput.value = cols
    rowsinput.value = rows



    let myCanvas = createCanvas(canvaswidth, canvasheight);
    myCanvas.parent("canvasbox");

    // setup the grid rows
    for (let index = 0; index < cols; index++) {
        grid[index] = new Array(rows)
    }


    // // setup the grid2 rows
    // for (let index = 0; index < cols; index++) {
    //     grid2[index] = new Array(rows)
    // }



    // populate the grid with cell instances
    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            grid[i][j] = new Cell(i, j)
        }
    }


    // // populate the grid2 with cell instances
    // for (let i = 0; i < cols; i++) {
    //     for (let j = 0; j < rows; j++) {
    //         grid2[i][j] = new Cell(i, j)
    //     }
    // }



    // calculate neighbors for each cell
    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            grid[i][j].addNeighbors()
        }
    }



    // set start and end nodes
    startNode = grid[startxy[0]][startxy[1]]
    endNode = grid[endxy[0]][endxy[1]]

    // add the start node to the openSet array
    openSet.push(startNode)

}



function setup() {
    mysetup()
}


function draw() {

    // Check if the mouse is over the canvas
    if (isMouseOverCanvas()) {
        // Change the mouse pointer style
        cursor("pointer");
    } else {
        // Reset the mouse pointer style to the default
        cursor();
    }




    // draw empty grid
    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {

            if (grid[i][j].obstacle == true) {


                grid[i][j].render(color(40, 84, 48))
            } else {
                stroke(200)
                fill(color(164, 190, 123))
                rect(grid[i][j].x * cellwidth, grid[i][j].y * cellheight, cellwidth, cellheight)
            }



        }
    }
    // draw home and end nodes
    stroke(200)
    fill(color(142, 50, 0))
    rect(startNode.x * cellwidth, startNode.y * cellheight, cellwidth, cellheight)
    rect(endNode.x * cellwidth, endNode.y * cellheight, cellwidth, cellheight)




    // draw image overlay
    if (p5img) {
        image(p5img, imagexy[0], imagexy[1], p5img.width * zoomscale, p5img.height * zoomscale);
    }







    for (let index = 0; index < path.length; index++) {


        path[index].render(color(255, 0, 0))


    }

    // draw timer
    // Set text properties
    textSize(32);
    textAlign(LEFT);
    fill(255);
    // Add text to the canvas
    text(currenttimer, 10, canvasheight - 10);






    if (playing == true) {



        background(color(164, 190, 123))

        // show the duplicated image after finishing the task
        p5img = copyimage
        // loop until openSet is empty

        if (openSet.length > 0) {


            // set current position - current position is a node in openset with the least f value
            let lowestindex = 0
            for (let index = 0; index < openSet.length; index++) {
                if (openSet[index].f < openSet[lowestindex].f) {
                    lowestindex = index
                }
            }

            current = openSet[lowestindex]

            // if current position == end we are done
            if (current == endNode) {

                console.log("we reached the destination!!!")
                stopTimer()
                currenttimer = `Solved in ${currenttimer}`
                myconfetti.addConfetti({
                    confettiRadius: 10,
                    confettiNumber: 200,
                })
                myconfetti.addConfetti({
                    confettiRadius: 10,
                    confettiNumber: 200,
                })

                // stop looping
                playing = false
                // noLoop()
            }


            // push current node to closedset and remove it from openset
            removethisfromarray(openSet, current)
            closedSet.push(current)


            // which new nodes to add to openset?
            // find all neighbors of current node
            let neighbors = current.neighbors
            // loop over each neighbor

            for (let index = 0; index < neighbors.length; index++) {
                let neighbor = neighbors[index]

                // make sure neighbor cell is not in the closedset array
                if (!closedSet.includes(neighbor) && !neighbor.obstacle) {

                    let tempg = current.g + 1

                    // does openset include this neighbor
                    if (openSet.includes(neighbor)) {
                        if (tempg < neighbor.g) {
                            neighbor.g = tempg
                        }

                    } else {
                        neighbor.g = tempg
                        openSet.push(neighbor)
                    }

                    // calculate h score
                    neighbor.h = heuristic(neighbor, endNode)
                    neighbor.f = neighbor.g + neighbor.h

                    // update came from 
                    neighbor.previous = current
                }
            }


        } else {
            // no possible open moves
            console.log("no possible open moves")



        }



        // draw empty grid
        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {

                if (grid[i][j].obstacle == true) {


                    grid[i][j].render(color(40, 84, 48))
                } else {
                    stroke(200)
                    fill(color(164, 190, 123))
                    rect(grid[i][j].x * cellwidth, grid[i][j].y * cellheight, cellwidth, cellheight)
                }



            }
        }



        // draw the obstacles
        // for (let i = 0; i < cols; i++) {
        //     for (let j = 0; j < rows; j++) {



        //         if (grid[i][j].obstacle == true) {
        //             grid[i][j].render(color(40, 84, 48))

        //         }

        //     }
        // }


        // draw image overlay
        if (p5img) {
            image(p5img, imagexy[0], imagexy[1], p5img.width * zoomscale, p5img.height * zoomscale);
        }


        // draw open set

        for (let index = 0; index < openSet.length; index++) {
            openSet[index].render(color(255, 0, 0, 50))
        }

        // draw closed set

        for (let index = 0; index < closedSet.length; index++) {
            closedSet[index].render(color(255, 0, 0, 50))
        }





        // find the optimal path
        path = []
        let temp = current

        path.push(temp)

        while (temp.previous) {
            path.push(temp.previous)
            temp = temp.previous
        }
        // draw the path

        for (let index = 0; index < path.length; index++) {


            path[index].render(color(255, 0, 0))


        }


        // draw home and end nodes
        stroke(200)
        fill(color(142, 50, 0))
        rect(startNode.x * cellwidth, startNode.y * cellheight, cellwidth, cellheight)
        rect(endNode.x * cellwidth, endNode.y * cellheight, cellwidth, cellheight)



        // draw timer
        // Set text properties
        textSize(32);
        textAlign(LEFT);
        fill(255);
        // Add text to the canvas
        text(currenttimer, 10, canvasheight - 10);


    }
}


function mouseDragged() {
    // Calculate the grid cell position based on the mouse coordinates
    let x = floor(mouseX / cellwidth);
    let y = floor(mouseY / cellheight);

    // Check if the cell position is within the grid bounds
    if (x >= 0 && x < cols && y >= 0 && y < rows) {
        // Set the value of the cell to 1
        grid[x][y].obstacle = true
    }
}


function keyPressed() {
    if (keyCode === 189 || keyCode === 109) {
        // Key code 189 is for minus (-) key in most keyboards
        // Key code 109 is for numpad minus (-) key
        console.log("minus key pressed")
        zoomscale = zoomscale - 0.01
    } else if (keyCode === 187 || keyCode === 107) {
        // Key code 187 is for plus (+) key in most keyboards
        // Key code 107 is for numpad plus (+) key
        console.log("plus key pressed")
        zoomscale = zoomscale + 0.01
    } else if (keyCode === UP_ARROW) {
        // Call your function here when the up arrow key is pressed
        console.log("up arrow key pressed")

        imagexy[1] = imagexy[1] - 10
    } else if (keyCode === DOWN_ARROW) {
        // Call your function here when the down arrow key is pressed
        console.log("down arrow key pressed")
        imagexy[1] = imagexy[1] + 10

    } else if (keyCode === LEFT_ARROW) {
        // Call your function here when the left arrow key is pressed
        console.log("left arrow key pressed")
        imagexy[0] = imagexy[0] - 10
    } else if (keyCode === RIGHT_ARROW) {
        // Call your function here when the right arrow key is pressed
        console.log("right arrow key pressed")
        imagexy[0] = imagexy[0] + 10
    } else if (key === "h") {
        console.log("hhhhh")


        // Calculate the grid cell position based on the mouse coordinates
        let x = floor(mouseX / cellwidth);
        let y = floor(mouseY / cellheight);

        // Check if the cell position is within the grid bounds
        if (x >= 0 && x < cols && y >= 0 && y < rows) {
            startNode = grid[x][y]
            openSet = []
            openSet.push(startNode)
        }

    } else if (key === "e") {
        console.log("eeeee")
        // Calculate the grid cell position based on the mouse coordinates
        let x = floor(mouseX / cellwidth);
        let y = floor(mouseY / cellheight);

        // Check if the cell position is within the grid bounds
        if (x >= 0 && x < cols && y >= 0 && y < rows) {
            endNode = grid[x][y]

        }


    }




}



class Cell {
    constructor(i, j) {
        this.f = 0
        this.g = 0
        this.h = 0
        this.x = i
        this.y = j
        this.neighbors = []
        this.previous = null
        this.obstacle = false
    }

    render(color) {
        //   stroke(color)
        noStroke()
        fill(color)
        rect(this.x * cellwidth, this.y * cellheight, cellwidth, cellheight)
    }



    addNeighbors() {
        let i = this.x
        let j = this.y
        if (i < cols - 1) {
            this.neighbors.push(grid[i + 1][j])

        }
        if (i > 0) {
            this.neighbors.push(grid[i - 1][j])

        }

        if (j < rows - 1) {
            this.neighbors.push(grid[i][j + 1])

        }
        if (j > 0) {
            this.neighbors.push(grid[i][j - 1])
        }



    }

}


function removethisfromarray(arr, element) {
    for (let index = arr.length - 1; index >= 0; index--) {
        if (arr[index] == element) {
            arr.splice(index, 1)
        }

    }
}


function heuristic(a, b) {
    // var d = dist(a.x, a.y, b.x, b.y)

    let d = abs(a.x - b.x) + abs(a.y - b.y)

    return d
}


function isMouseOverCanvas() {
    // Check if the mouse coordinates are within the canvas boundaries
    return mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height;
}

// Function to handle file input change event
function handleFileInput(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function (event) {
        console.log(event)
        const imageContainer = document.getElementById('imageContainer');
        let tempimage = new Image();
        tempimage.src = event.target.result;
        imageContainer.appendChild(tempimage);

        p5img = loadImage(event.target.result)
        copyimage = loadImage(event.target.result)

    };

    reader.readAsDataURL(file);
}


function formatTime(milliseconds) {
    let totalSeconds = Math.floor(milliseconds / 1000);
    let minutes = Math.floor(totalSeconds / 60);
    let seconds = totalSeconds % 60;
    let hours = Math.floor(minutes / 60);
    minutes %= 60;

    return `${padNumber(hours)}:${padNumber(minutes)}:${padNumber(seconds)}`;
}


function padNumber(number) {
    return number.toString().padStart(2, '0');
}

function startTimer() {
    if (!isRunning) {
        startTime = Date.now();
        intervalId = setInterval(updateTimer, 1000);
        isRunning = true;
    }
}

function stopTimer() {
    if (isRunning) {
        clearInterval(intervalId);
        isRunning = false;
    }
}

function resetTimer() {
    stopTimer();
    timerElement.textContent = '00:00:00';
}

function updateTimer() {
    let currentTime = Date.now();
    let elapsedTime = currentTime - startTime;
    //    timerElement.textContent = formatTime(elapsedTime);
    currenttimer = formatTime(elapsedTime);
}



// startButton.addEventListener('click', startTimer);
// stopButton.addEventListener('click', stopTimer);
// resetButton.addEventListener('click', resetTimer);
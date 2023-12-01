
var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 432,
    backgroundColor:'#90EE90',
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var game = new Phaser.Game(config);
var ui;
var fruits;
var rocks;
var bucket;
var cursors;

var score = 0;
var missedFruits = 0;

var isGameFrozen = false;

function preload(){
    this.load.image('bucket', 'assets/bucket.webp');
    this.load.image('apple','assets/apple.png')
    this.load.image('banana', 'assets/banana.png')
    this.load.image('grape', 'assets/grape.png')
    this.load.image('kiwi', 'assets/kiwi.png')
    this.load.image('orange', 'assets/orange.png')
    this.load.image('cherry', 'assets/cherry.png')
    this.load.image('rock', 'assets/rock.png')

}
function clearGameState(scene) {

    if (!isGameFrozen) {
        isGameFrozen = true;
        
        if (ui.scoreText) {
            ui.scoreText.destroy();
        }

        ui.removeMissedText()
        missedFruits = 0

        score = 0;
        fruits.fruitGroup.clear(true, true); // Clear existing fruits
        rocks.rockGroup.clear(true, true);   // Clear existing rocks

        scene.time.removeAllEvents();

        bucket.destroy();
        ui.restartBox(scene);
    }
}



function create(){
    // Enable cursors
    cursors = this.input.keyboard.createCursorKeys();

    // Every 3 seconds, spawn rock
    this.time.addEvent({
        delay: 3000,
        callback: spawnRocks,
        callbackScope: this,
        loop: true
    });

    var Ui = new Phaser.Class({
        initialize:function (scene,x,y){
            //Initialize score text
            this.scoreText = scene.add.text(x, y, 'Score: 0', { fontSize: '32px', fill: '#000' })
            this.scene = scene
            this.xSymbols = []
        },
        restartBox: function(scene){
           
            var restartText = scene.add.text(config.width / 2, config.height / 2, 'Press to Restart', { fontSize: '32px', fill: '#000' }).setOrigin(0.5);
            restartText.setInteractive();
           
            restartText.on('pointerdown', function () {
                restartText.destroy();
                isGameFrozen = false;
                 //When text is clicked, restart a game calling create again
                create.call(scene);
            });
        },
        updateScore: function(){
            score += 10
            this.scoreText =  this.scoreText.setText('Score: ' + score);
        },
        trackMissed: function(){
            let initialPosition = 750;
            for (let i = 0; i < missedFruits; i++) {
                // Create a text object and store the reference in the array
                let symbol = this.scene.add.text(initialPosition - i * 20, 5, 'X', { fontSize: '32px', fill: '#FF0000' });
                this.xSymbols.push(symbol);
            }
        },
        removeMissedText: function() {
            // Iterate through the array and destroy each text object
            for (let i = 0; i < this.xSymbols.length; i++) {
                this.xSymbols[i].destroy();
            }
            // Clear the array
            this.xSymbols = [];
        }
        
    })

   
    
    var Bucket = new Phaser.Class({
        Extends: Phaser.GameObjects.Sprite,
        initialize: function(scene,x,y){
            Phaser.GameObjects.Sprite.call(this, scene, x, y, 'bucket');
            scene.add.existing(this);
            scene.physics.world.enable(this);
            this.setScale(0.5)
        },

        move:function(){

            if(this.x >= 750){
                this.x = 749
            }else if(this.x <= 50){
                this.x = 51
            }
        
            if(cursors.up.isDown){
                return
            }else if(cursors.down.isDown){
                return
            }else if(cursors.right.isDown){
                this.x += 10
            }else if(cursors.left.isDown){
                this.x -= 10
            }

            // Collision tracking
            fruits.fruitGroup.children.iterate(function (fruit) {
                if(fruit){
                    if(Phaser.Geom.Intersects.RectangleToRectangle(bucket.getBounds(), fruit.getBounds())){
                        this.catchFruit(fruit)
                    }
                }
                
            }, this);

            // Collision tracking
            rocks.rockGroup.children.iterate(function (rock) {
                if(rock){
                    if(Phaser.Geom.Intersects.RectangleToRectangle(bucket.getBounds(), rock.getBounds())){
                        this.catchRock(rock)
                    }
                }
            },this);
            
        },
        catchFruit: function(fruit){
            ui.updateScore()
            fruit.destroy()
            fruits.spawnFruit()
        },

        catchRock: function(rock){
            rock.destroy()
            clearGameState(this.scene)
        }
        
    })

    var Fruit = new Phaser.Class({
        Extends: Phaser.GameObjects.Sprite,

        initialize: function (scene,quantity) {
            this.scene = scene
            this.fruitGroup = scene.physics.add.group()
            
            for (let i = 0; i < quantity; i++) {
                this.spawnFruit();
            }
            scene.physics.world.enable(this.fruitGroup);
            
        },
        spawnFruit: function(){
            let spawned = false
            const fruits = ['banana','kiwi','cherry','orange','grape']

            if(!spawned){
                let selectedFruit = fruits[Math.floor(Math.random() * 5)]
                var x = Phaser.Math.Between(100, config.width - 100);
                var y = Phaser.Math.Between(-500, 0);
                var fruit = this.scene.physics.add.sprite(x, y, selectedFruit)

                fruit.setScale(2)
                this.fruitGroup.add(fruit);
                fruit.setGravityY(30)

                spawned = true   
            }
           
        },

    })

    var Rock = new Phaser.Class({
        Extends: Phaser.GameObjects.Sprite,

        initialize: function(scene) {
            this.scene = scene;
            this.rockGroup = scene.physics.add.group();
            scene.physics.world.enable(this.rockGroup);
        },
    
        spawn: function() {
            var x = Phaser.Math.Between(100, config.width - 100);
            var y = Phaser.Math.Between(-500, 0);
            var rock = this.scene.physics.add.sprite(x, y, 'rock');
            rock.setScale(2);
            this.rockGroup.add(rock);
            rock.setGravityY(30);
        }
    })

    ui = new Ui(this,16,16)
    bucket = new Bucket(this,400,350)
    fruits = new Fruit(this,5)
    rocks = new Rock(this)
    
}

// Called every 3 seconds
function spawnRocks() {
    rocks.spawn();
}


function update(){
    bucket.move()
    ui.trackMissed()

    //If objects fall under the map
    fruits.fruitGroup.children.iterate(function (fruit) {
        if (fruit && fruit.y > 432) {
            fruits.spawnFruit()
            fruit.destroy()
            if(missedFruits === 2){
                clearGameState(fruits.scene)
            }else{
                missedFruits += 1
            }
            
        }
    });
    
    rocks.rockGroup.children.iterate(function (rock) {
        if (rock && rock.y > 432) {
            rock.destroy();
            return;
        }
    });
    
}



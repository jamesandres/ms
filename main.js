import React from 'react';
import ReactDOM from 'react-dom';

window.React = React; // Enable React dev tools

const MINE = "💣"
const FLAG = "⛳️"

class MS {
    constructor(el, mapWidth=25, mapHeight=45, mineiness=0.25) {
        this.el = el;
        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;
        this.mineiness = mineiness;
        this.winLossState = null;

        // Re-render every second to update the clock.
        this.startTime = new Date();
        this.endTime = new Date();
        this.timer = setInterval(() => this.tick(), 1000);

        this.initMap();
        this.render();
    }

    tick() {
        this.endTime = new Date();
        this.render();
    }

    /**
     * for mineiness:
     *  - 0.1 will return true 10% of the time
     *  - 0.9 will return true 90% of the time
     */
    _shouldMakeMine() {
        return Math.random() < this.mineiness;
    }

    sweepAround(map, x, y, callbackFn) {
        let numMines = 0, ox, oy;

        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) {
                    continue; // Scan around the spot, not ON the spot.
                }

                // Offset x and y
                ox = x + i;
                oy = y + j;

                if (map[ox] === undefined || map[ox][oy] === undefined) {
                    continue; // Out of bounds yo
                }

                callbackFn(ox, oy, i, j);
            }
        }

        return numMines;
    }

    _numMinesSurrounding(baseMap, x, y) {
        let numMines = 0;
        this.sweepAround(baseMap, x, y, (_x, _y) => {
            if (baseMap[_x][_y].value === MINE) {
                numMines += 1;
            }
        });
        return numMines;
    }

    _defaultSquareData(value=0) {
        return {value: value, revealed: false, flagged: false};
    }

    initMap() {
        let baseMap = [];

        // Build the base map. It contains only the mines
        for (let x = 0; x < this.mapWidth; x += 1) {
            baseMap[x] = [];
            for (let y = 0; y < this.mapHeight; y += 1) {
                baseMap[x][y] = this._defaultSquareData(this._shouldMakeMine() ? MINE : 0);
            };
        };

        // Build the final map. It contains both the base mines and the numbers.
        this.map = Object.assign([], baseMap);
        for (let x = 0; x < this.mapWidth; x += 1) {
            for (let y = 0; y < this.mapHeight; y += 1) {
                if (baseMap[x][y].value === MINE) {
                    continue;
                }

                this.map[x][y].value = this._numMinesSurrounding(baseMap, x, y);
            };
        };
    }

    toString() {
        let lines = [], char;

        for (let x = 0; x < this.mapWidth; x += 1) {
            lines[x] = [];
            for (let y = 0; y < this.mapHeight; y += 1) {
                lines[x][y] = this.map[x][y].value;
            };
            lines[x] = lines[x].join("\t");
        };

        return lines.join("\n");
    }

    sweepAndClear(x, y) {
        this.sweepAround(this.map, x, y, (_x, _y, _i, _j) => {
            if (this.map[_x][_y].value === MINE || this.map[_x][_y].revealed) {
                return;
            }

            this.map[_x][_y].revealed = true;

            if (_i == 0 || _j == 0 || this.map[_x][_y].value === 0) {
                this.sweepAndClear(_x, _y);
            }
        });
    }

    squareSweep(e, x, y) {
        e.preventDefault();
        if (this.winLossState !== null) {
            return
        }

        if (this.map[x][y].value === MINE) {
            this.map[x][y].revealed = true;
            this.winLossState = false;
            clearInterval(this.timer);
            this.render();
            return;
        }

        this.sweepAndClear(x, y);
        this.render();
    }

    squareFlag(e, x, y) {
        e.preventDefault();
        if (this.winLossState !== null) {
            return
        }

        this.map[x][y].flagged = !this.map[x][y].flagged

        let allCleared = true;
        for (let _x = 0; _x < this.mapWidth; _x += 1) {
            for (let _y = 0; _y < this.mapHeight; _y += 1) {
                if (!(this.map[_x][_y].revealed || this.map[_x][_y].flagged)) {
                    allCleared = false;
                    break;
                }
            };
        };

        if (allCleared) {
            this.winLossState = true;
            clearInterval(this.timer);
        }

        this.render()
    }

    reset(e) {
        window.location = "/";
    }

    renderSquare(x, y) {
        let key = ['btn', x, y].join('-')

        let sweepHandler = (function (_this, _x, _y) {
            return function (e) {
                _this.squareSweep(e, _x, _y);
            };
        })(this, x, y);

        let flagHandler = (function (_this, _x, _y) {
            return function (e) {
                _this.squareFlag(e, _x, _y);
            };
        })(this, x, y);

        let value, classes = ["square"];
        if (this.map[x][y].revealed) {
            value = this.map[x][y].value;
            classes.push("revealed")
        } else if (this.map[x][y].flagged) {
            value = FLAG;
            classes.push("flagged")
        }
        else {
            value = "\u00a0";
        }

        return <button key={key}
                       className={classes.join(' ')}
                       onClick={sweepHandler}
                       onContextMenu={flagHandler}>{value}</button>
    }

    renderTitle() {
        switch (this.winLossState) {
            case true:  return <h2>You WIN!</h2>; break;
            case false: return <h2>You Lose.</h2>; break;
        }
        return <h2>Minesweepah</h2>;
    }

    renderReset() {
        if (this.winLossState !== null) {
            return <button onClick={this.reset}>Reset</button>;
        }
    }

    renderClock() {
        let elapsed = parseInt((this.endTime.getTime() - this.startTime.getTime()) / 1000, 10);

        let minutes = parseInt(elapsed / 60, 10)
        let seconds = elapsed % 60

        return <div className="clock">
            <span>{minutes}:{seconds}</span>
        </div>
    }

    renderMap() {
        let rows = [], cols;

        for (let x = 0; x < this.mapWidth; x += 1) {
            cols = [];
            for (let y = 0; y < this.mapHeight; y += 1) {
                cols.push(this.renderSquare(x, y));
            };
            rows.push(<div key={["col", x].join('-')}>{cols}</div>);
        };

        let winLose = null;
        switch (this.winLossState) {
            case true:  winLose = <h2>You WIN!</h2>; break;
            case false: winLose = <h2>You Lose.</h2>; break;
        }

        return <div className="ms">
            <div className="header">
                {this.renderTitle()}
                {this.renderReset()}
                {this.renderClock()}
            </div>
            <div className="map">{rows}</div>
        </div>;
    }

    render() {
        ReactDOM.render(this.renderMap(), this.el);
    }
}

window.MS = MS;

export const shuffle = (range: number, push: number): number[] | number => {
    const array = new Array(range).fill(0).map((a, i) => i);
    for(let i = array.length - 1; i > 0; i--){
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array && push === 1 ? array.splice(0, 1)[0] : array.splice(0, push);
}
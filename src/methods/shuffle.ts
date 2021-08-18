export const shuffle = (range: number, push: number) => {
    const array = new Array(range).fill(0).map((a, i) => i);
    for(let i = array.length - 1; i > 0; i--){
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array.splice(0, push);
}